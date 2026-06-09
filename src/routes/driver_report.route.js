import { Router }           from "express";
import { isAuthorized }      from "../middleware/auth.middleware.js";
import { restrictTo }        from "../middleware/permission.middleware.js";
import { driverDailyReport } from "../controllers/driver_report.controller.js";

const router = Router({ mergeParams: true });

router.use(isAuthorized);

/**
 * GET /api/v1/drivers/:id/reports/daily?date=YYYY-MM-DD
 * Permission: "generate-driver-report"
 * Returns: JSON { reportUrl, filename }
 */
router.get(
  "/:id/reports/daily",
  restrictTo("generate-driver-report"),
  driverDailyReport,
);

export default router;