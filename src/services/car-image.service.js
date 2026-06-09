import { prisma } from "../lib/prisma.js";
import { recordActivity } from "./audit.service.js";
import { createAppError } from "../utils/createAppError.js";
import { getFileUrl } from "../utils/getFileUrl.js";
import { carImageSelect } from "../selectors/car-image.selector.js";

// Add multiple images to a car
export const addCarImages = async (req, carId, imagesData) => {
  try {
    // 1. If maintenanceId is provided, verify it exists
    const mId = imagesData[0]?.maintenanceId;
    if (mId) {
      const maintenanceExists = await prisma.carMaintenanceHistory.findUnique({
        where: { id: mId }
      });
      if (!maintenanceExists) {
        throw createAppError(404, "maintenance_record_not_found");
      }
    }

    // 2. Verify car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { plateNumber: true, plateLetters: true }
    });

    if (!car) {
      throw createAppError(404, "car_not_found");
    }

    // 3. Create images
    await prisma.carImages.createMany({
      data: imagesData.map(img => ({
        carId,
        image: img.image,
        publicId: img.image,
        stage: img.stage || "GENERAL",
        maintenanceId: img.maintenanceId || null
      }))
    });

    // 4. Log activity
    await recordActivity(req, {
      action: "ADD_CAR_IMAGES",
      module: "CarImage",
      recordId: carId,
      description: `إضافة ${imagesData.length} صور جديدة للسيارة رقم (${car?.plateNumber} ${car?.plateLetters})`,
      newData: imagesData
    });

    // 5. Return images with URLs
    const imagesWithUrls = await prisma.carImages.findMany({
      where: { carId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: imagesData.length,
      select: carImageSelect
    });

    return imagesWithUrls.map(img => ({
      ...img,
      url: getFileUrl(req, "car-photos", img.image)
    }));
  } catch (error) {
    if (error.statusCode) throw error;
    throw createAppError(500, "Failed to add car images");
  }
};



// Soft delete a specific car image
export const deleteCarImage = async (req, imageId) => {
  try {
    const image = await prisma.carImages.update({
      where: { id: imageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false
      },
    });

    const car = await prisma.car.findUnique({
      where: { id: image.carId },
      select: { plateNumber: true, plateLetters: true }
    });

    await recordActivity(req, {
      action: "DELETE_CAR_IMAGE",
      module: "CarImage",
      recordId: imageId,
      description: `حذف صورة من ألبوم السيارة رقم (${car?.plateNumber} ${car?.plateLetters})`,
      oldData: image,
      status: "SUCCESS"
    });

    return image;
  } catch (error) {
    if (error.statusCode) throw error;
    throw createAppError(500, "Failed to delete car image");
  }
};



// Get all images for a specific car with filtering and sorting
export const getCarImages = async (req, carId, filters = {}) => {
  try {
    const { day, month, year, date, sortBy = 'desc' } = filters;
    const where = { carId, isDeleted: false };

    // 1. If a full date is provided (e.g., 2026-05-05)
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate)) {
        const startDate = new Date(targetDate.setHours(0, 0, 0, 0));
        const endDate = new Date(targetDate.setHours(23, 59, 59, 999));
        where.createdAt = { gte: startDate, lte: endDate };
      }
    } 
    // 2. Fallback to day/month/year if provided
    else if (day || month || year) {
      const now = new Date();
      const targetYear = year ? parseInt(year) : now.getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : (day ? now.getMonth() : (year ? 0 : now.getMonth()));
      
      let startDate, endDate;

      if (day) {
        const targetDay = parseInt(day);
        startDate = new Date(targetYear, targetMonth, targetDay, 0, 0, 0);
        endDate = new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999);
      } else if (month) {
        startDate = new Date(targetYear, targetMonth, 1, 0, 0, 0);
        endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
      } else if (year) {
        startDate = new Date(targetYear, 0, 1, 0, 0, 0);
        endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
      }

      if (startDate && endDate) {
        where.createdAt = { gte: startDate, lte: endDate };
      }
    }

    const images = await prisma.carImages.findMany({
      where,
      orderBy: { createdAt: sortBy === 'asc' ? 'asc' : 'desc' },
      select: carImageSelect
    });

    return images.map(img => ({
      ...img,
      url: getFileUrl(req, "car-photos", img.image)
    }));
  } catch (error) {
    if (error.statusCode) throw error;
    throw createAppError(500, "Failed to get car images");
  }
};



// Get archived (deleted) images for a specific car
export const getCarImagesArchive = async (req, carId) => {
  try {
    const images = await prisma.carImages.findMany({
      where: { carId, isDeleted: true },
      orderBy: { deletedAt: 'desc' },
      select: carImageSelect
    });

    return images.map(img => ({
      ...img,
      url: getFileUrl(req, "car-photos", img.image)
    }));
  } catch (error) {
    if (error.statusCode) throw error;
    throw createAppError(500, "Failed to get car images archive");
  }
};
