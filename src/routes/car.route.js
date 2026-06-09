import express from "express";
import * as carController from "../controllers/car.controller.js";
import { validate } from "../middleware/validate.js";
import { carSchemas } from "../validators/car.validator.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(isAuthorized)

router
  .route("/")
  .post(restrictTo("create-car"), validate(carSchemas.create), carController.createCarController) // Create a new car
  .get(restrictTo("read-car"), carController.getAllCarsController); // Get all cars (paginated/filtered)

router.get("/archived", restrictTo("read-deleted-car"), carController.getArchivedCarsController);

router
  .route("/:id")
  .get(restrictTo("read-car"), carController.getCarByIdController) // Get car by ID
  .patch(restrictTo("update-car"), validate(carSchemas.update), carController.updateCarController) // Update car details
  .delete(restrictTo("delete-car"), carController.deleteCarController); // Soft delete car

export default router;
