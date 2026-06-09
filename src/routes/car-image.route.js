import express from "express";
import * as carImageController from "../controllers/car-image.controller.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.js";
import * as carImageValidator from "../validators/carImage.validator.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(isAuthorized);

// Route to manage images for a specific car
router
  .route("/car/:id")
  .post(
    restrictTo("create-car-image"), 
    validate(carImageValidator.carIdSchema, "params"),
    upload.array("images", 6), 
    validate(carImageValidator.addCarImagesSchema),
    carImageController.addCarImagesController
  )
  .get(
    restrictTo("read-car-image"), 
    validate(carImageValidator.carIdSchema, "params"),
    carImageController.getCarImagesController
  );

// Route to get archived (deleted) images for a specific car
router.get(
  "/car/:id/archive",
  restrictTo("read-car-image-archive"),
  validate(carImageValidator.carIdSchema, "params"),
  carImageController.getCarImagesArchiveController
);

// Route to delete a specific image by its ID
router.delete(
  "/:imageId", 
  restrictTo("delete-car-image"), 
  validate(carImageValidator.imageIdSchema, "params"),
  carImageController.deleteCarImageController
);

export default router;
