import * as carService from "../services/car.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendResponse } from "../utils/response.js";

// Create a new car
export const createCarController = asyncHandler(async (req, res) => {
  const car = await carService.createCar(req, req.body);
  return sendResponse(res, 201, "Car created successfully", car);
});

// Get all cars with filtering and pagination
export const getAllCarsController = asyncHandler(async (req, res) => {
  const result = await carService.getAllCars(req.query);
  return sendResponse(res, 200, "Cars fetched successfully", result);
});

// Get archived cars
export const getArchivedCarsController = asyncHandler(async (req, res) => {
  const result = await carService.getArchivedCars(req.query);
  return sendResponse(res, 200, "Archived cars fetched successfully", result);
});

// Get car by ID
export const getCarByIdController = asyncHandler(async (req, res) => {
  const car = await carService.getCarById(req.params.id);
  return sendResponse(res, 200, "Car fetched successfully", car);
});

// Update car details
export const updateCarController = asyncHandler(async (req, res) => {
  const car = await carService.updateCar(req, req.params.id, req.body);
  return sendResponse(res, 200, "Car updated successfully", car);
});

// Soft delete car
export const deleteCarController = asyncHandler(async (req, res) => {
  await carService.softDeleteCar(req, req.params.id);
  return res.status(204).send();
});
