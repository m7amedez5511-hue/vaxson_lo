import express from "express";
import { swaggerUi, swaggerSpec } from "../../swagger.js";
import clientRouter from "./client.route.js";
import roleRouter from "./role.route.js"
import premissionRouter from "./premission.route.js"
import branchRouter from "./branch.route.js";
import carRouter from "./car.route.js";
import carMaintenanceRouter from "./car-maintenance.route.js";
import { standaloneAddressRouter } from "./client-address.route.js";
import userRouter from "./user.route.js"
import authRouter from "./auth.route.js"
import driverRouter from "./driver.route.js"
import orderRouter from "./order.route.js";
import maintenanceRouter from "./standalone-maintenance.route.js";
import tripRouter from "./trip.route.js"
import auditRouter from "./audit.route.js"
import carImageRouter from "./car-image.route.js"
import dashboardRouter from "./dashboard.route.js"
import rolePremissionRouter from "./rolePremission.route.js"
import driverReportRouter from "./driver_report.route.js"

const router = express.Router();

// Documentation - using bundled spec from swagger.js
router.use("/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API is running" });
});

// v1 Resources
router.use("/v1/auth",authRouter)
router.use("/v1/client", clientRouter);
router.use("/v1/addresses", standaloneAddressRouter);
router.use("/v1/branches", branchRouter);
router.use("/v1/cars", carRouter);
router.use("/v1/users",userRouter)
router.use("/v1/orders", orderRouter);
router.use("/v1/maintenance", maintenanceRouter);


router.use("/v1/role",roleRouter)
router.use("/v1/premission",premissionRouter)
router.use("/v1/role-permissions", rolePremissionRouter);

router.use("/v1/cars/:carId/maintenance", carMaintenanceRouter);
router.use("/v1/driver",driverRouter)
router.use("/v1/trip",tripRouter)
router.use("/v1/audit", auditRouter)
router.use("/v1/dashboard", dashboardRouter);
router.use("/v1/car-images", carImageRouter)


router.use("/v1/drivers", driverReportRouter);


export default router;
