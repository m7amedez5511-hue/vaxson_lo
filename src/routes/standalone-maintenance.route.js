import express from "express";
import * as carMaintenanceController from "../controllers/car-maintenance.controller.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(isAuthorized);

// Global archive for all maintenance records
router.get("/archived", restrictTo("read-deleted-maintenance"), carMaintenanceController.getArchivedMaintenanceController);

export default router;
