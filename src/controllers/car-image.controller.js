import * as carImageService from "../services/car-image.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendResponse } from "../utils/response.js";
import { createAppError } from "../utils/createAppError.js";

// add car imagescontroller
export const addCarImagesController = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Car ID
  const { stage, maintenanceId } = req.body;
  
  if (!req.files || req.files.length === 0) {
    return next(createAppError(400, "no_images_uploaded"));
  }

  const imagesData = req.files.map(file => ({
    image: file.filename,
    stage: stage || "GENERAL",
    maintenanceId: maintenanceId || null
  }));

  const result = await carImageService.addCarImages(req, id, imagesData);

  sendResponse(res, 201, "images_added_successfully", result);
});


// delete car image controller
export const deleteCarImageController = asyncHandler(async (req, res, next) => {
  const { imageId } = req.params;
  const result = await carImageService.deleteCarImage(req, imageId);
  sendResponse(res, 200, "image_deleted_successfully", result);
});

// get car images controller
export const getCarImagesController = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Car ID
  const result = await carImageService.getCarImages(req, id, req.query);
  sendResponse(res, 200, "images_fetched_successfully", result);
});

// get car images archive controller
export const getCarImagesArchiveController = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Car ID
  const result = await carImageService.getCarImagesArchive(req, id);
  sendResponse(res, 200, "archived_images_fetched_successfully", result);
});
