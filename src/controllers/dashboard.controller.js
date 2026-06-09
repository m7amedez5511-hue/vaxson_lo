import * as dashboardService from "../services/dashboard.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendResponse } from "../utils/response.js";

/**
 * Get Dashboard Summary
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user.id);
  
  sendResponse(res, 200, "dashboard summary fetched successfully", summary);
});
