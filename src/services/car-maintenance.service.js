import { prisma } from "../lib/prisma.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { createAppError } from "../utils/createAppError.js";
import { recordActivity } from "./audit.service.js";
import { maintenanceSelect, maintenanceArchiveSelect } from "../selectors/car-maintenance.selector.js";

//Create a new maintenance record and update car status
export const createMaintenance = async (req, maintenanceData) => {
  try {
    const { carId, startAt, endAt } = maintenanceData;

    const maintenance = await prisma.$transaction(async (tx) => {
      const car = await tx.car.findUnique({
        where: { id: carId },
      });

      if (!car || car.isDeleted) {
        throw createAppError(404, "car_not_found");
      }

      // Logic: Only update car status if it's currently in maintenance
      const now = new Date();
      const isStarted = !startAt || new Date(startAt) <= now;
      const isFinished = endAt && new Date(endAt) <= now;
      const shouldUpdateStatus = isStarted && !isFinished;

      // 1. Create maintenance record
      const maintenance = await tx.carMaintenanceHistory.create({
        data: { ...maintenanceData },
        select: maintenanceSelect,
      });

      // 2. Conditionally update car status to InMaintenance
      if (shouldUpdateStatus) {
        await tx.car.update({
          where: { id: carId },
          data: { currentStatus: "InMaintenance" },
        });

        // 3. Log status change in CarStatusHistory
        await tx.carStatusHistory.create({
          data: {
            carId: carId,
            carStatus: "InMaintenance",
          },
        });
      }

      return maintenance;
    });

    await recordActivity(req, {
      action: "CREATE_MAINTENANCE",
      module: "CarMaintenance",
      recordId: maintenance.id,
      description: `إضافة سجل صيانة جديد للسيارة (ID: ${carId})`,
      newData: maintenance
    });

    return maintenance;
  } catch (error) {
    await recordActivity(req, {
      action: "CREATE_MAINTENANCE",
      module: "CarMaintenance",
      description: `فشل في إضافة سجل صيانة للسيارة (ID: ${maintenanceData.carId})`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

//Get maintenance history for a specific car
export const getCarMaintenanceHistory = async (carId) => {
  return await prisma.carMaintenanceHistory.findMany({
    where: { carId },
    orderBy: { createdAt: "desc" },
    select: maintenanceSelect,
  });
};

// Get archived maintenance history (optional carId filter)
export const getArchivedMaintenance = async (carId, query) => {
  const features = new PrismaFeatures(prisma.carMaintenanceHistory, query)
    .filter(["maintenanceType", "provider"])
    .sort(["createdAt", "startAt", "endAt", "cost"])
    .paginate();

  features.queryOptions.where = { 
    ...features.queryOptions.where, 
    isDeleted: true 
  };
  features.selectOrInclude(maintenanceArchiveSelect);

  if (carId) {
    features.queryOptions.where.carId = carId;
  }

  return await features.exec();
};

//Update maintenance record
export const updateMaintenance = async (req, maintenanceId, updateData, carId) => {
  try {
    const maintenance = await prisma.carMaintenanceHistory.findFirst({
      where: { id: maintenanceId, carId },
    });

    if (!maintenance) {
      throw createAppError(404, "maintenance_record_not_found");
    }

    const updatedMaintenance = await prisma.carMaintenanceHistory.update({
      where: { id: maintenanceId },
      data: updateData,
      select: maintenanceSelect,
    });

    await recordActivity(req, {
      action: "UPDATE_MAINTENANCE",
      module: "CarMaintenance",
      recordId: updatedMaintenance.id,
      description: `تعديل سجل صيانة للسيارة (ID: ${updatedMaintenance.carId})`,
      oldData: maintenance,
      newData: updatedMaintenance
    });

    return updatedMaintenance;
  } catch (error) {
    await recordActivity(req, {
      action: "UPDATE_MAINTENANCE",
      module: "CarMaintenance",
      recordId: maintenanceId,
      description: `فشل في تعديل سجل صيانة للسيارة`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

//Soft delete maintenance and revert car status to Active
export const deleteMaintenance = async (req, maintenanceId, carId) => {
  try {
    const maintenance = await prisma.carMaintenanceHistory.findFirst({
      where: { id: maintenanceId, carId },
    });

    if (!maintenance) {
      throw createAppError(404, "maintenance_record_not_found");
    }

    const car = await prisma.car.findUnique({
      where: { id: maintenance.carId },
      select: { currentStatus: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark as deleted
      await tx.carMaintenanceHistory.update({
        where: { id: maintenanceId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 2. Revert car status to Active only if it is currently InMaintenance
      if (car?.currentStatus === "InMaintenance") {
        await tx.car.update({
          where: { id: maintenance.carId },
          data: { currentStatus: "Active" },
        });

        // 3. Log status change back to Active in CarStatusHistory
        await tx.carStatusHistory.create({
          data: {
            carId: maintenance.carId,
            carStatus: "Active",
          },
        });
      }

      return { message: "maintenance_deleted_and_car_reverted_to_active" };
    });

    await recordActivity(req, {
      action: "DELETE_MAINTENANCE",
      module: "CarMaintenance",
      recordId: maintenanceId,
      description: `حذف سجل صيانة للسيارة (ID: ${maintenance.carId})`,
      oldData: maintenance,
      status: "SUCCESS"
    });

    return result;
  } catch (error) {
    await recordActivity(req, {
      action: "DELETE_MAINTENANCE",
      module: "CarMaintenance",
      recordId: maintenanceId,
      description: `فشل في حذف سجل صيانة للسيارة`,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error;
  }
};

//findMaintenanceForWindows: Find maintenance records that have start or end dates within the given windows and match car statuses
export const findMaintenanceForWindows = async ({ preWin, dueWin, statuses }) => {
  return prisma.carMaintenanceHistory.findMany({
    where: {
      isDeleted: false,
      car: { isDeleted: false, isActive: true, currentStatus: { in: statuses } },
      OR: [
        { startAt: { gte: preWin.from, lte: preWin.to } },
        { endAt:   { gte: preWin.from, lte: preWin.to } },
        { endAt:   { gte: dueWin.from, lte: dueWin.to } },
      ],
    },
    select: {
      id: true, carId: true, startAt: true, endAt: true,
      car: { select: { plateNumber: true } },
    },
  });
};