import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = Router();

router.use(isAuthorized);

router.get("/summary", dashboardController.getDashboardSummary);

export default router;
