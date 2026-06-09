import { asyncHandler }              from "../middleware/errorHandler.js";
import { generateDriverDailyReport } from "../services/driver_report.service.js";
import { createAppError }            from "../utils/createAppError.js";
import { sendResponse }              from "../utils/response.js";

/**
 * GET /api/v1/drivers/:id/reports/daily?date=YYYY-MM-DD
 * Returns JSON: { reportUrl, filename }
 */
export const driverDailyReport = asyncHandler(async (req, res) => {
  const driverId = req.params.id;
  const date     = req.query.date ?? new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw createAppError(400, "Invalid date format. Use YYYY-MM-DD");

  const result = await generateDriverDailyReport(req, driverId, date);

  sendResponse(res, 200, "driver_report_generated_successfully", result);
});