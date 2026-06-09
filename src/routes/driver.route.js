import { Router } from "express";
import * as DC from "../controllers/driver.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createDriverValidator,
  updateDriverValidator,
} from "../validators/driver.validato.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import upload from "../middleware/upload.js";

const router = Router();

router.use(isAuthorized);

const driverImagesUpload = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "nationalPhoto", maxCount: 1 },
  { name: "driverCardPhoto", maxCount: 1 },
]);

//add new driver
router.post(
  "/",
  restrictTo("create-driver"),
  driverImagesUpload,
  validate(createDriverValidator),
  DC.createDriver,
);
//get all driver
router.get("/", restrictTo("read-driver"), DC.getAllDriver);
//get current driver info (must be before /:id)
router.get("/me", restrictTo("read-driver"), DC.driverInfo);
//archived ـــــــــــــــــــــــ
router.get(
  "/archived",
  restrictTo("read-deleted-driver"),
  DC.fetchArchivedDrivers,
);
//get archived driver by id
router.get(
  "/archived/:id",
  restrictTo("read-deleted-driver"),
  DC.getArchivedDriverById,
);
// Get archived status history for driver
router.get(
  "/archived/driverStatus/:id",
  restrictTo("read-deleted-driver"),
  DC.fetchArchivedDriverStatusHistory,
);
//ـــــــــــــــــــــــــــــ
//get driver by driverId
router.get("/:id", restrictTo("read-driver"), DC.getDriverById);
//update driver by driver Id
router.patch(
  "/:id",
  restrictTo("update-driver"),
  driverImagesUpload,
  validate(updateDriverValidator),
  DC.updateDriver,
);
//detet driver by driverId
router.delete("/:id", restrictTo("delete-driver"), DC.softDeleteDriver);
// Soft delete a driver status history record
router.delete(
  "/driverStatus/:id",
  restrictTo("deleted-driver-Status"),
  DC.deleteDriverStatusHistory,
);

export default router;
