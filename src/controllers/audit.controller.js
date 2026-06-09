import { asyncHandler } from "../middleware/errorHandler.js";
import { getAllActivities, getActivityById } from "../services/audit.service.js";
import { sendResponse } from "../utils/response.js";

/**
 * Get all activity logs with advanced filtering and pagination
 */
export const getActivities = asyncHandler(async (req, res, next) => {
  const filters = req.query; // PrismaFeatures will handle parsing the query
  const result = await getAllActivities(filters);

  sendResponse(res, 200, "Activities fetched successfully", result);
});

/**
 * Get a single activity log by ID with full details
 */
export const getActivityDetails = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const result = await getActivityById(id);

  if (!result) {
    return sendResponse(res, 404, "Activity log not found", null);
  }

  sendResponse(res, 200, "Activity details fetched successfully", result);
});
