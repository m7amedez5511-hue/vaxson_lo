import { Router } from "express";
import { isAuthorized } from "../middleware/auth.middleware.js";
import {
  assignPermissionToRole,
  removePermissionFromRole,
  setPermissionsForRole,
} from "../controllers/rolePremission.controller.js"; // fixed: comma -> dot
import { assignPermissionValidator, bulkAssignPermissionValidator } from "../validators/rolePremisson.validators.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.js"; // fixed: was imported from "node-cron"

const router = Router();
router.use(isAuthorized);

// Assign one permission to a role
router.post(
  "/:id/permissions",
  restrictTo("manage-role-permissions"),
  validate(assignPermissionValidator),
  assignPermissionToRole
);

// Bulk-replace all permissions for a role (multi-permission support)
router.patch(
  "/:id/permissions",
  restrictTo("manage-role-permissions"),
  validate(bulkAssignPermissionValidator),
  setPermissionsForRole
);

// Remove a single permission from a role
router.delete(
  "/:id/permissions/:permissionId",
  restrictTo("manage-role-permissions"),
  removePermissionFromRole
);

export default router;