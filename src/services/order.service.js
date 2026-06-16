import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import ClientAddress from "../models/ClientAddress.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { recordActivity } from "./audit.service.js";


/**
 * Helper to update trip counters based on order status change
 * Note: Increments only, per user requirement for archiving.
 */
const updateTripCounters = async (tx, tripId, status) => {
  if (!tripId) return;

  const updateData = {};
  if (status === "InTransit") updateData.collectedCount = { increment: 1 };
  if (status === "Delivered") updateData.deliveredCount = { increment: 1 };
  if (status === "Returned" || status === "Cancelled") updateData.returnedCount = { increment: 1 };

  if (Object.keys(updateData).length > 0) {
    await tx.trip.update({
      where: { id: tripId },
      data: updateData,
    });
  }
};

// Create a new Order with Hybrid Address Logic
export const createOrder = async (req, orderData, deliveryAddressData = null, pickupAddressData = null) => {
  // Track MongoDB docs created before the PG transaction so we can
  // roll them back (compensating delete) if Prisma fails.
  const mongoAddressesToRollback = [];

  try {
    // ── Step 1: Write MongoDB addresses BEFORE the Prisma transaction ──
    // This keeps them outside the tx callback (they can't participate in a
    // Prisma rollback anyway), and gives us their IDs to embed in the PG row.
    let deliveryAddressId = orderData.deliveryAddressId;
    let pickupAddressId = orderData.pickupAddressId;

    if (deliveryAddressData) {
      const newAddr = await ClientAddress.create({
        ...deliveryAddressData,
        clientId: orderData.clientId,
      });
      deliveryAddressId = newAddr._id.toString();
      mongoAddressesToRollback.push(newAddr._id);
    }

    if (pickupAddressData) {
      const newAddr = await ClientAddress.create({
        ...pickupAddressData,
        clientId: orderData.clientId,
      });
      pickupAddressId = newAddr._id.toString();
      mongoAddressesToRollback.push(newAddr._id);
    }

    // ── Step 2: Prisma transaction (PostgreSQL only) ──
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Order in PostgreSQL
      const order = await tx.order.create({
        data: {
          ...orderData,
          deliveryAddressId,
          pickupAddressId,
          currentStatus: "Created",
        },
      });

      // 2. Record Initial History
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "Created",
          reason: "Initial creation",
        },
      });

      // 3. Record Assigned history if order is immediately linked to a trip
      if (order.tripId) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "Assigned",
            reason: "Assigned upon creation",
          },
        });
      }

      return order;
    });

    await recordActivity(req, {
      action: "CREATE_ORDER",
      module: "Order",
      recordId: order.id,
      description: `إنشاء طلب جديد رقم: ${order.shipmentNumber}`,
      newData: order
    });

    return order;
  } catch (error) {
    // ── Compensating delete: remove any MongoDB addresses already written ──
    if (mongoAddressesToRollback.length > 0) {
      await ClientAddress.deleteMany({ _id: { $in: mongoAddressesToRollback } }).catch((mongoErr) => {
        // Log but don't swallow the original error
        console.error("Failed to rollback MongoDB addresses after PG transaction failure:", mongoErr);
      });
    }

    await recordActivity(req, {
      action: "CREATE_ORDER",
      module: "Order",
      description: `فشل في إنشاء طلب جديد رقم: ${orderData.shipmentNumber || "Unknown"}`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Update Order Status and Trip Counters
export const updateOrderStatus = async (req, orderId, status, reason = null) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current order to find its trip
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, shipmentNumber: true, tripId: true, currentStatus: true },
      });

      if (!currentOrder) throw createAppError(404, "order_not_found");

      // 2. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { currentStatus: status },
      });

      // 3. Record History
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          reason,
        },
      });

      // 4. Update Trip Counters (Only if status changed to a 'Counting' status)
      if (currentOrder.tripId && currentOrder.currentStatus !== status) {
        await updateTripCounters(tx, currentOrder.tripId, status);
      }

      return { oldData: currentOrder, newData: updatedOrder };
    });

    await recordActivity(req, {
      action: "UPDATE_ORDER_STATUS",
      module: "Order",
      recordId: result.newData.id,
      description: `تغيير حالة الطلب رقم ${result.newData.shipmentNumber} إلى ${status}`,
      oldData: { status: result.oldData.currentStatus },
      newData: { status: result.newData.currentStatus, reason }
    });

    return result.newData;
  } catch (error) {
    await recordActivity(req, {
      action: "UPDATE_ORDER_STATUS",
      module: "Order",
      recordId: orderId,
      description: `فشل في تغيير حالة الطلب`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Transfer Order to a New Trip
export const transferToTrip = async (req, orderId, newTripId) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check Order
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw createAppError(404, "order_not_found");

      // 2. Update Order to New Trip and Reset Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          tripId: newTripId,
          currentStatus: "Assigned",
        },
      });

      // 3. Record History for Transfer
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "Assigned",
          reason: `Transferred to new trip: ${newTripId}`,
        },
      });

      return { oldData: order, newData: updatedOrder };
    });

    await recordActivity(req, {
      action: "TRANSFER_ORDER",
      module: "Order",
      recordId: result.newData.id,
      description: `نقل الطلب رقم ${result.newData.shipmentNumber} إلى رحلة جديدة`,
      oldData: { tripId: result.oldData.tripId },
      newData: { tripId: result.newData.tripId }
    });

    return result.newData;
  } catch (error) {
    await recordActivity(req, {
      action: "TRANSFER_ORDER",
      module: "Order",
      recordId: orderId,
      description: `فشل في نقل الطلب إلى رحلة جديدة`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Get all active orders with filtering and pagination
export const getAllOrders = async (query) => {
  const features = new PrismaFeatures(prisma.order, query)
    .filter(["currentStatus", "tripId", "clientId", "branchId", "paymentMethod", "paymentStatus"])
    .search(["shipmentNumber", "recipientName", "recipientPhone"])
    .sort(["createdAt", "shipmentNumber", "currentStatus"])
    .paginate();

  // Ensure isDeleted is false by default
  features.queryOptions.where = { 
    ...features.queryOptions.where, 
    isDeleted: false 
  };

  return await features.exec();
};

// Get archived orders
export const getArchivedOrders = async (query) => {
  const features = new PrismaFeatures(prisma.order, query)
    .filter(["currentStatus", "tripId", "clientId", "branchId", "paymentMethod", "paymentStatus"])
    .search(["shipmentNumber", "recipientName", "recipientPhone"])
    .sort(["createdAt", "shipmentNumber", "currentStatus"])
    .paginate();

  // Archive only
  features.queryOptions.where = { 
    ...features.queryOptions.where, 
    isDeleted: true 
  };

  return await features.exec();
};

// Get a single order by ID
export const getOrderById = async (id) => {
  const order = await prisma.order.findFirst({
    where: { 
      id,
      isDeleted: false 
    },
    include: {
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
      client: true,
      trip: true,
    },
  });

  if (!order) throw createAppError(404, "order_not_found");
  return order;
};

// Update general Order data (excludes status/trip logic)
export const updateOrder = async (req, id, updateData) => {
  try {
    // Check existence
    const existingOrder = await getOrderById(id);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await recordActivity(req, {
      action: "UPDATE_ORDER",
      module: "Order",
      recordId: updatedOrder.id,
      description: `تعديل بيانات الطلب رقم: ${updatedOrder.shipmentNumber}`,
      oldData: existingOrder,
      newData: updatedOrder
    });

    return updatedOrder;
  } catch (error) {
    await recordActivity(req, {
      action: "UPDATE_ORDER",
      module: "Order",
      recordId: id,
      description: `فشل في تعديل بيانات الطلب`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Soft delete an Order
export const softDeleteOrder = async (req, id) => {
  try {
    // Check existence
    const existingOrder = await getOrderById(id);

    await prisma.order.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await recordActivity(req, {
      action: "DELETE_ORDER",
      module: "Order",
      recordId: id,
      description: `حذف الطلب رقم: ${existingOrder.shipmentNumber}`,
      oldData: existingOrder,
      status: "SUCCESS"
    });
  } catch (error) {
    await recordActivity(req, {
      action: "DELETE_ORDER",
      module: "Order",
      recordId: id,
      description: `فشل في حذف الطلب`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};