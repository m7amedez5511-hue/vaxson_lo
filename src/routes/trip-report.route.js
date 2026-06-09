import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { generateTripManifest } from "../services/trip-report.service.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { sendResponse } from "../utils/response.js";

const router = Router({ mergeParams: true });

router.use(isAuthorized);

/**
 * Generate and get Trip Manifest Report
 * GET /api/v1/trips/:id/reports
 */
router.get(
  "/",
  restrictTo("generate-trip-report"),
  asyncHandler(async (req, res) => {
    const tripId = req.params.id;
    const reportUrl = await generateTripManifest(req, tripId);
    
    sendResponse(res, 200, "report generated successfully", { reportUrl });
  })
);

/**
 * Generate and get Trip Manifest Report specific to a Client
 * GET /api/v1/trips/:id/reports/client/:clientId
 */
router.get(
  "/client/:clientId",
  restrictTo("generate-trip-report"), 
  asyncHandler(async (req, res) => {
    const tripId = req.params.id;
    const clientId = req.params.clientId;
    const reportUrl = await generateTripManifest(req, tripId, clientId);
    
    sendResponse(res, 200, "client report generated successfully", { reportUrl });
  })
);

export default router;
