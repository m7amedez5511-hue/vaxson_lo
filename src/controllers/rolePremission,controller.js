import { asyncHandler } from "../middleware/errorHandler.js";
import { assignPermissionToRoleActivity, setRolePermissions } from "../services/rolePremission.service.js";
import { sendResponse } from "../utils/response.js";
import { prisma } from "../lib/prisma.js";

export const assignPermissionToRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;           // roleId from URL
  const { permissionId } = req.body;   // permissionId from body

  const result = await assignPermissionToRoleActivity(req, id, permissionId);

  sendResponse(res, 201, "Permission assigned successfully", result);
});

// Bulk replace permissions for a role (atomic)
export const setPermissionsForRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { permissionIds } = req.body;

  const result = await setRolePermissions(req, id, permissionIds);

  sendResponse(res, 200, "Role permissions updated successfully", result);
});

export const removePermissionFromRole = asyncHandler(async (req, res, next) => {
  const { id, permissionId } = req.params;  // both from URL

  await softDeleteRolePremission(req, id, permissionId);

  return res.status(204).send();
});

