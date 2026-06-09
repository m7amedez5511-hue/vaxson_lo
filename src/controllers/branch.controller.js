import * as branchService from "../services/branch.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendResponse } from "../utils/response.js";

// Create a new branch
export const createBranchController = asyncHandler(async (req, res) => {
  const branch = await branchService.createBranch(req, req.body);
  return sendResponse(res, 201, "Branch created successfully", branch);
});

// Get all active branches with features
export const getAllBranchesController = asyncHandler(async (req, res) => {
  const result = await branchService.getAllBranches(req.query);
  return sendResponse(res, 200, "Branches fetched successfully", result);
});

// get archived branches
export const getArchivedBranchesController = asyncHandler(async (req, res) => {
  const result = await branchService.getArchivedBranches(req.query);
  return sendResponse(res, 200, "Archived branches fetched successfully", result);
});

// Get branch by ID
export const getBranchByIdController = asyncHandler(async (req, res) => {
  const branch = await branchService.getBranchById(req.params.id);
  return sendResponse(res, 200, "Branch fetched successfully", branch);
});

// Update branch
export const updateBranchController = asyncHandler(async (req, res) => {
  const branch = await branchService.updateBranch(req, req.params.id, req.body);
  return sendResponse(res, 200, "Branch updated successfully", branch);
});

// Soft delete branch
export const deleteBranchController = asyncHandler(async (req, res) => {
  await branchService.softDeleteBranch(req, req.params.id);
  return res.status(204).send();
});
