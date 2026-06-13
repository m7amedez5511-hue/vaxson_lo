import { asyncHandler } from "../middleware/errorHandler.js";
import {
  assignPermissionToRoleActivity,
  setRolePermissions,
  softDeleteRolePremission,
} from "../services/rolePremission.service.js";
import { sendResponse } from "../utils/response.js";

/**
 * Assign a single permission to a role.
 * POST /role-permissions/:id/permissions
 * body: { permissionId }
 */
export const assignPermissionToRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { permissionId } = req.body;

  const result = await assignPermissionToRoleActivity(req, id, permissionId);

  sendResponse(res, 201, "Permission assigned successfully", result);
});

/**
 * Bulk replace ALL permissions for a role (atomic add + remove diff).
 * Enables assigning multiple distinct permissions in one call.
 * PATCH /role-permissions/:id/permissions
 * body: { permissionIds: string[] }
 */
export const setPermissionsForRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { permissionIds } = req.body;

  const result = await setRolePermissions(req, id, permissionIds);

  sendResponse(res, 200, "Role permissions updated successfully", result);
});

/**
 * Remove (soft-delete) a single permission from a role.
 * DELETE /role-permissions/:id/permissions/:permissionId
 */
export const removePermissionFromRole = asyncHandler(async (req, res, next) => {
  const { id, permissionId } = req.params;

  await softDeleteRolePremission(req, id, permissionId);

  return res.status(204).send();
});