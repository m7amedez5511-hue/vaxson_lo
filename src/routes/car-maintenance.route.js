import express from "express";
import * as carMaintenanceController from "../controllers/car-maintenance.controller.js";
import { validate } from "../middleware/validate.js";
import { carMaintenanceSchemas } from "../validators/car-maintenance.validator.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

// This router is mounted at /api/v1/cars/:carId/maintenance
// so :carId is available via req.params.carId (mergeParams: true)
const router = express.Router({ mergeParams: true });

router.use(isAuthorized)


// POST   /api/v1/cars/:carId/maintenance
// GET    /api/v1/cars/:carId/maintenance
router
  .route("/")
  .post(restrictTo("create-maintenance"), validate(carMaintenanceSchemas.create), carMaintenanceController.createMaintenanceController)
  .get(restrictTo("read-maintenance"), carMaintenanceController.getCarMaintenanceHistoryController);

router.get("/archived", restrictTo("read-deleted-maintenance"), carMaintenanceController.getArchivedMaintenanceController);

// PATCH  /api/v1/cars/:carId/maintenance/:maintenanceId
// DELETE /api/v1/cars/:carId/maintenance/:maintenanceId
router
  .route("/:maintenanceId")
  .patch(restrictTo("update-maintenance"), validate(carMaintenanceSchemas.update), carMaintenanceController.updateMaintenanceController)
  .delete(restrictTo("delete-maintenance"), carMaintenanceController.deleteMaintenanceController);

export default router;
