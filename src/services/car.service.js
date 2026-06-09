import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { recordActivity } from "./audit.service.js";
import { carSelect } from "../selectors/car.selector.js";

// Create a new car with initial status history
export const createCar = async (req, carData) => {
  try {
    const car = await prisma.$transaction(async (tx) => {
      // 1. Create the car record
      const car = await tx.car.create({
        data: carData,
        select: carSelect,
      });

      // 2. Add initial log entry in status history
      await tx.carStatusHistory.create({
        data: {
          carId: car.id,
          carStatus: car.currentStatus,
          impoundStatus: car.currentImpoundStatus,
        },
      });

      return car;
    });

    await recordActivity(req, {
      action: "CREATE_CAR",
      module: "Car",
      recordId: car.id,
      description: `إضافة سيارة جديدة: ${car.manufacturer} ${car.model} (${car.plateNumber})`,
      newData: car
    });

    return car;
  } catch (error) {
    await recordActivity(req, {
      action: "CREATE_CAR",
      module: "Car",
      description: `فشل في إضافة سيارة جديدة: ${carData.manufacturer || ""} ${carData.model || ""} (${carData.plateNumber || ""})`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Get all cars with filtering and pagination
export const getAllCars = async (query) => {
  const features = new PrismaFeatures(prisma.car, query)
    .filter()
    .sort()
    .paginate()
    .search(["manufacturer", "model", "plateNumber", "vinNumber"]);

  features.queryOptions.where = {
    ...features.queryOptions.where,
    isDeleted: false,
  };

  features.queryOptions.select = carSelect;

  const result = await features.exec();
  return result;
};

// Get archived cars
export const getArchivedCars = async (query) => {
  const features = new PrismaFeatures(prisma.car, query)
    .filter()
    .sort()
    .paginate()
    .search(["manufacturer", "model", "plateNumber", "vinNumber"]);

  features.queryOptions.where = {
    ...features.queryOptions.where,
    isDeleted: true,
  };

  features.queryOptions.select = carSelect;

  const result = await features.exec();
  return result;
};

// Get car by its unique ID
export const getCarById = async (id) => {
  const car = await prisma.car.findFirst({
    where: { id, isDeleted: false },
    select: {
      ...carSelect,
      branch: { select: { name: true } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          carStatus: true,
          impoundStatus: true,
          createdAt: true,
        },
      },
    },
  });

  if (!car) {
    throw createAppError(404, "car_not_found");
  }

  return car;
};

// Update car details and track status changes if they occur
export const updateCar = async (req, id, updateData) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current data for comparison
      const currentCar = await tx.car.findUnique({
        where: { id },
      });

      if (!currentCar || currentCar.isDeleted) {
        throw createAppError(404, "car_not_found");
      }

      // 2. Apply updates
      const updatedCar = await tx.car.update({
        where: { id },
        data: updateData,
        select: carSelect,
      });

      // 3. Detect changes in status or impound status
      const statusChanged = 
        (updateData.currentStatus && updateData.currentStatus !== currentCar.currentStatus) ||
        (updateData.currentImpoundStatus !== undefined && updateData.currentImpoundStatus !== currentCar.currentImpoundStatus);

      if (statusChanged) {
        await tx.carStatusHistory.create({
          data: {
            carId: id,
            carStatus: updatedCar.currentStatus,
            impoundStatus: updatedCar.currentImpoundStatus,
          },
        });
      }

      return { oldData: currentCar, newData: updatedCar };
    });

    await recordActivity(req, {
      action: "UPDATE_CAR",
      module: "Car",
      recordId: result.newData.id,
      description: `تعديل بيانات السيارة: ${result.newData.manufacturer} ${result.newData.model} (${result.newData.plateNumber})`,
      oldData: result.oldData,
      newData: result.newData
    });

    return result.newData;
  } catch (error) {
    await recordActivity(req, {
      action: "UPDATE_CAR",
      module: "Car",
      recordId: id,
      description: `فشل في تعديل بيانات السيارة`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Soft delete a car
export const softDeleteCar = async (req, id) => {
  try {
    const car = await getCarById(id);

    await prisma.car.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false
      },
    });

    await recordActivity(req, {
      action: "DELETE_CAR",
      module: "Car",
      recordId: id,
      description: `حذف السيارة: ${car.manufacturer} ${car.model} (${car.plateNumber})`,
      oldData: car,
      status: "SUCCESS"
    });
  } catch (error) {
    await recordActivity(req, {
      action: "DELETE_CAR",
      module: "Car",
      recordId: id,
      description: `فشل في حذف السيارة`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

// Get archived status history for a specific car
export const getArchivedCarStatusHistory = async (carId, query) => {
  const features = new PrismaFeatures(prisma.carStatusHistory, query)
    .filter()
    .sort()
    .paginate();

  features.queryOptions.where = { 
    ...features.queryOptions.where, 
    carId,
    isDeleted: true 
  };

  return await features.exec();
};

// Soft delete a car status history record
export const softDeleteCarStatusHistory = async (req, historyId) => {
  try {
    const history = await prisma.carStatusHistory.update({
      where: { id: historyId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await recordActivity(req, {
      action: "DELETE_CAR_STATUS_HISTORY",
      module: "Car",
      recordId: historyId,
      description: `حذف سجل حالة سيارة`,
      oldData: history,
      status: "SUCCESS"
    });
  } catch (error) {
    throw error;
  }
};
//Find cars with upcoming insurance/registration expiries for notification purposes
export const findCarsForExpiry = async ({ pre, post, statuses }) => {
  return prisma.car.findMany({
    where: {
      isDeleted: { not: true },
      isActive: true,
      currentStatus: { in: statuses },
      OR: [
        { insuranceExpiryDate:    { gte: pre.from,  lte: pre.to  } },
        { insuranceExpiryDate:    { gte: post.from, lte: post.to } },
        { registrationExpiryDate: { gte: pre.from,  lte: pre.to  } },
        { registrationExpiryDate: { gte: post.from, lte: post.to } },
      ],
    },
    select: { id: true, plateNumber: true, insuranceExpiryDate: true, registrationExpiryDate: true },
  });
};