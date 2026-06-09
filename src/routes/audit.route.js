import express from "express";
import { getActivities, getActivityDetails } from "../controllers/audit.controller.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to protect audit routes
router.use(isAuthorized);

// Get paginated and filtered activity logs
router.get("/", restrictTo("read-audit"), getActivities);

// Get specific activity log details
router.get("/:id", restrictTo("read-audit"), getActivityDetails);

export default router;
