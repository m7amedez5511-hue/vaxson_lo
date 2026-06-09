import * as orderService from "../services/order.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendResponse } from "../utils/response.js";

// Create a new order with optional delivery address data
export const createOrderController = asyncHandler(async (req, res) => {
  const { deliveryAddress, pickupAddress, ...orderData } = req.body;
  const order = await orderService.createOrder(req, orderData, deliveryAddress, pickupAddress);
  return sendResponse(res, 201, "Order created successfully", order);
});

// Get all active orders with features
export const getAllOrdersController = asyncHandler(async (req, res) => {
  const result = await orderService.getAllOrders(req.query);
  return sendResponse(res, 200, "Orders fetched successfully", result);
});

// get archived orders
export const getArchivedOrdersController = asyncHandler(async (req, res) => {
  const result = await orderService.getArchivedOrders(req.query);
  return sendResponse(res, 200, "Archived orders fetched successfully", result);
});

// Get order by ID with history
export const getOrderByIdController = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  return sendResponse(res, 200, "Order fetched successfully", order);
});

// Update general order metadata
export const updateOrderController = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrder(req, req.params.id, req.body);
  return sendResponse(res, 200, "Order updated successfully", order);
});

// Specialized update for order status with history recording
export const updateOrderStatusController = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const order = await orderService.updateOrderStatus(req, req.params.id, status, reason);
  return sendResponse(res, 200, "Order status updated successfully", order);
});

// Transfer order to a new trip
export const transferOrderTripController = asyncHandler(async (req, res) => {
  const { tripId } = req.body;
  const order = await orderService.transferToTrip(req, req.params.id, tripId);
  return sendResponse(res, 200, "Order transferred to trip successfully", order);
});

// Soft delete an order
export const deleteOrderController = asyncHandler(async (req, res) => {
  await orderService.softDeleteOrder(req, req.params.id);
  return res.status(204).send();
});
