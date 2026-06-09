import express from "express";
import * as addressController from "../controllers/client-address.controller.js";
import { validate } from "../middleware/validate.js";
import { createAddressSchema, updateAddressSchema } from "../validators/client-address.validator.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
  
const router = express.Router({ mergeParams: true });

router.use(isAuthorized)

// Routes for /v1/client/:clientId/addresses
router.post(
  "/",
  restrictTo("create-client-address"),
  validate(createAddressSchema),
  addressController.createAddressController
);

router.get("/", restrictTo("read-client-address"), addressController.getClientAddressesController);
router.get("/archived", restrictTo("read-deleted-client-address"), addressController.getArchivedAddressesController);

/**
 * Standalone routes for /v1/addresses/:id
 * Note: These will be mounted separately in the main router
 */
export const standaloneAddressRouter = express.Router();

// Apply auth to standalone as well to be safe
standaloneAddressRouter.use(isAuthorized);

standaloneAddressRouter.patch(
  "/:id",
  restrictTo("update-client-address"),
  validate(updateAddressSchema),
  addressController.updateAddressController
);

standaloneAddressRouter.get("/archived", restrictTo("read-deleted-client-address"), addressController.getArchivedAddressesController);

standaloneAddressRouter.delete("/:id", restrictTo("delete-client-address"), addressController.deleteAddressController);

export default router;
