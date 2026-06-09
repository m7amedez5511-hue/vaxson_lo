import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema, updateOrderSchema, transferOrderSchema, updateOrderStatusSchema } from "../validators/order.validator.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { isAuthorized } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(isAuthorized)

router.route("/")
  .post(restrictTo("create-order"), validate(createOrderSchema), orderController.createOrderController)
  .get(restrictTo("read-order"), orderController.getAllOrdersController);

router.get("/archived", restrictTo("read-deleted-order"), orderController.getArchivedOrdersController);

router.route("/:id")
  .get(restrictTo("read-order"), orderController.getOrderByIdController)
  .patch(restrictTo("update-order"), validate(updateOrderSchema), orderController.updateOrderController)
  .delete(restrictTo("delete-order"), orderController.deleteOrderController);

// Specialized endpoints
router.patch("/:id/status", restrictTo("update-order-status"), validate(updateOrderStatusSchema), orderController.updateOrderStatusController);
router.patch("/:id/transfer", restrictTo("transfer-order"), validate(transferOrderSchema), orderController.transferOrderTripController);

export default router;
