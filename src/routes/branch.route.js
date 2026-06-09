import express from "express";
import * as branchController from "../controllers/branch.controller.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { createBranchSchema, updateBranchSchema } from "../validators/branch.validator.js";
import { restrictTo } from "../middleware/permission.middleware.js";

const router = express.Router();

router.use(isAuthorized)

router
  .route("/")
  .post(restrictTo("create-branch"), validate(createBranchSchema), branchController.createBranchController)
  .get(restrictTo("read-branch"), branchController.getAllBranchesController);

router.get("/archived", restrictTo("read-deleted-branch"), branchController.getArchivedBranchesController);

router
  .route("/:id")
  .get(restrictTo("read-branch"), branchController.getBranchByIdController)
  .patch(restrictTo("update-branch"), validate(updateBranchSchema), branchController.updateBranchController)
  .delete(restrictTo("delete-branch"), branchController.deleteBranchController);

export default router;


