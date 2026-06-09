import express from "express";
import * as clientController from "../controllers/client.controller.js";
import addressRouter from "./client-address.route.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { createClientSchema, updateClientSchema } from "../validators/client.validator.js";
import { restrictTo } from "../middleware/permission.middleware.js";

const router = express.Router();

router.use(isAuthorized)

router.post("/", restrictTo("create-client"), validate(createClientSchema), clientController.createClientController);
router.get("/", restrictTo("read-client"), clientController.getAllClientsController);
router.get("/archived", restrictTo("read-deleted-client"), clientController.getArchivedClientsController);
router.get("/archived/:id", restrictTo("read-deleted-client"), clientController.getArchivedClientByIdController);
router.get("/:id", restrictTo("read-client"), clientController.getClientByIdController);
router.put("/:id", restrictTo("update-client"), validate(updateClientSchema), clientController.updateClientController);
router.delete("/:id", restrictTo("delete-client"), clientController.deleteClientController);
router.get("/:id/orders/archived", restrictTo("read-deleted-order"), clientController.getClientArchivedOrdersController);

// Nested addresses
router.use("/:clientId/addresses", addressRouter);

export default router;
