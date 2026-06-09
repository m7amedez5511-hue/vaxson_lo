import { asyncHandler } from "../middleware/errorHandler.js";
import * as carMaintenanceService from "../services/car-maintenance.service.js";
import { sendResponse } from "../utils/response.js";

// POST /api/v1/cars/:carId/maintenance
export const createMaintenanceController = asyncHandler(async (req, res) => {
  const { carId } = req.params;
  const maintenance = await carMaintenanceService.createMaintenance(req, { carId, ...req.body });
  return sendResponse(res, 201, "Maintenance created successfully", maintenance);
});

// GET /api/v1/cars/:carId/maintenance
export const getCarMaintenanceHistoryController = asyncHandler(async (req, res) => {
  const { carId } = req.params;
  const history = await carMaintenanceService.getCarMaintenanceHistory(carId);
  return sendResponse(res, 200, "Maintenance history fetched successfully", history);
});

// get archived maintenance
export const getArchivedMaintenanceController = asyncHandler(async (req, res) => {
  const { carId } = req.params;
  const result = await carMaintenanceService.getArchivedMaintenance(carId, req.query);
  return sendResponse(res, 200, "Archived maintenance fetched successfully", result);
});

// PATCH /api/v1/cars/:carId/maintenance/:maintenanceId
export const updateMaintenanceController = asyncHandler(async (req, res) => {
  const maintenance = await carMaintenanceService.updateMaintenance(req, req.params.maintenanceId, req.body);
  return sendResponse(res, 200, "Maintenance updated successfully", maintenance);
});

// DELETE /api/v1/cars/:carId/maintenance/:maintenanceId
export const deleteMaintenanceController = asyncHandler(async (req, res) => {
  await carMaintenanceService.deleteMaintenance(req, req.params.maintenanceId);
  return res.status(204).send();
});
