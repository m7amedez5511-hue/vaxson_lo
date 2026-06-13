import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { recordActivity } from "./audit.service.js";
import * as crud from "./crud.service.js";

// Assign permission to role
export const assignPermissionToRoleActivity = async (
  req,
  roleId,
  permissionId,
) => {
  // 1. Verify role exists
  const role = await crud.findById("role", roleId);
  if (!role) throw createAppError(404, "Role_NotFound");

  // 2. Verify permission exists
  const permission = await crud.findById("permission", permissionId);
  if (!permission) throw createAppError(404, "Permission_NotFound");

  // 3. Check for duplicate assignment (409 Conflict)
  const existing = await crud.findFirst("rolePermission", {
    roleId,
    permissionId,
  });
  if (existing) throw createAppError(409, "Permission_Already_Assigned");

  // 4. Create the link
  const newRolePermission = await crud.create("rolePermission", {
    roleId,
    permissionId,
  });

  await recordActivity(req, {
    action: "ASSIGN_PERMISSION_TO_ROLE",
    module: "Role",
    recordId: roleId,
    description: `تم تعيين صلاحية "${permission.name}" للدور: ${role.name}`,
    status: "SUCCESS",
  });

  return newRolePermission;
};

/**
 * Atomically replace a role's permission set.
 * Computes the diff (toAdd / toRemove) against current rolePermission rows
 * and applies it inside a single transaction.
 */
export const setRolePermissions = async (req, roleId, permissionIds) => {
  try {
    // 1. Verify role exists
    const role = await crud.findById("role", roleId);
    if (!role) throw createAppError(404, "Role_NotFound");

    // 2. Verify all permission IDs exist
    const existingPerms = await prisma.permission.findMany({
      where: { id: { in: permissionIds }, isDeleted: false },
      select: { id: true, name: true },
    });
    if (existingPerms.length !== permissionIds.length) {
      throw createAppError(400, "Permission_Invalid");
    }

    // 3. Get current assignments (non-deleted)
    const current = await prisma.rolePermission.findMany({
      where: { roleId, isDeleted: false },
      select: { id: true, permissionId: true },
    });
    const currentIds = current.map((rp) => rp.permissionId);

    const toAdd = permissionIds.filter((id) => !currentIds.includes(id));
    const toRemove = current.filter(
      (rp) => !permissionIds.includes(rp.permissionId),
    );

    // 4. Apply atomically
    await prisma.$transaction([
      ...toAdd.map((permissionId) =>
        prisma.rolePermission.create({ data: { roleId, permissionId } }),
      ),
      ...toRemove.map((rp) =>
        prisma.rolePermission.update({
          where: { id: rp.id },
          data: { isDeleted: true, deletedAt: new Date() },
        }),
      ),
    ]);

    await recordActivity(req, {
      action: "UPDATE_ROLE_PERMISSIONS",
      module: "Role",
      recordId: roleId,
      description: `تم تحديث صلاحيات الدور: ${role.name} (إضافة ${toAdd.length}, إزالة ${toRemove.length})`,
      status: "SUCCESS",
    });

    // 5. Return fresh role with permissions
    return crud.fetchOne(
      "role",
      { id: roleId, isDeleted: false },
      {
        include: {
          permissions: {
            where: { isDeleted: false },
            include: { permission: true },
          },
        },
      },
    );
  } catch (error) {
    await recordActivity(req, {
      action: "UPDATE_ROLE_PERMISSIONS",
      module: "Role",
      description: `فشل تحديث صلاحيات الدور`,
      status: "FAILED",
      errorMessage: error.message,
    });
    if (error.isOperational) throw error;
    throw createAppError(500, `Error__${error}`);
  }
};

// Remove (soft-delete) permission from role
export const softDeleteRolePremission = async (req, roleId, permissionId) => {
  try {
    // 1. Verify role exists
    const role = await crud.findById("role", roleId);
    if (!role) throw createAppError(404, "Role_NotFound");

    // 2. Verify the permission is actually assigned to this role
    const rolePermission = await crud.findFirst("rolePermission", {
      roleId,
      permissionId,
    });
    if (!rolePermission) throw createAppError(404, "Role_Permission_NotFound");

    // 3. Remove it
    const result = await crud.softDelete("rolePermission", rolePermission.id);

    await recordActivity(req, {
      action: "REMOVE_PERMISSION_FROM_ROLE",
      module: "Role",
      recordId: roleId,
      description: `تم إزالة صلاحية من الدور: ${role.name}`,
      status: "SUCCESS",
    });

    return result;
  } catch (error) {
    await recordActivity(req, {
      action: "REMOVE_PERMISSION_FROM_ROLE",
      module: "Role",
      description: `فشل إزالة الصلاحية من الدور`,
      status: "FAILED",
      errorMessage: error.message,
    });
    // Re-throw known AppErrors as-is; wrap unknown ones
    if (error.isOperational) throw error;
    throw createAppError(500, `Error__${error}`);
  }
};
