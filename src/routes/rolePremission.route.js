import { Router } from "express";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { assignPermissionToRole, removePermissionFromRole, setPermissionsForRole } from "../controllers/rolePremission,controller.js";
import { assignPermissionValidator, bulkAssignPermissionValidator } from "../validators/rolePremisson.validators.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { validate } from "node-cron";





const router = Router()
router.use(isAuthorized)


// Assign permission to role
router.post("/:id/permissions", restrictTo("manage-role-permissions"), validate(assignPermissionValidator), assignPermissionToRole);
// Bulk-replace all permissions for a role (atomic add+remove)
router.patch(
  "/:id/permissions",
  restrictTo("manage-role-permissions"),
  validate(bulkAssignPermissionValidator),
  setPermissionsForRole
);  
// Remove permission from role
router.delete("/:id/permissions/:permissionId", restrictTo("manage-role-permissions"), removePermissionFromRole);

export default router