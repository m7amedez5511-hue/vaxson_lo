import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { recordActivity } from "./audit.service.js";
import * as crud from "./crud.service.js";

/**
 * create new role
 */

export const newRole = async (req, roleData) => {
  try {
    //create role
    const role = await crud.create("role", { ...roleData });

    // ✅ register add role action
    await recordActivity(req, {
      action: "CREATE_ROLE",
      module: "Role",
      recordId: role.id,
      description: `  تم أضافة الدور: ${role.name}`,
      status: "SUCCESS",
    });

    return role;
  } catch (error) {
    //  Register add the role faild
    await recordActivity(req, {
      action: "CREATE_ROLE",
      module: "Role",
      description: `فشل أضافة الدور `,
      status: "FAILED",
      errorMessage: error.message,
    });
    throw createAppError(500, `Error__${error}`);
  }
};

//get all role matching with query using crud services
export const getAllMatchRole = async (query, deleted) => {
  const features = new PrismaFeatures(prisma.role, query)
    .filter()
    .search(["name", "description"])
    .sort()
    .paginate();

  features.queryOptions.where = {
    ...features.queryOptions.where,
    isDeleted: deleted,
  };
  features.queryOptions.select = {
    permissions: {
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        permission: {
          select: { id: true, name: true, slug: true, module: true },
        },
      },
    },
    users: {
      where: { isDeleted: false },
      select: { id: true, name: true, email: true, userName: true },
    },
  };
  const result = await features.exec();

  return result;
};

export const getRoleById = async (roleId, deleted) => {
  try {
    const role = await crud.fetchOne(
      "role",
      { id: roleId, isDeleted: deleted },
      {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          permissions: {
            where: { isDeleted: false },
            select: {
              id: true,
              permission: {
                select: { id: true, name: true, slug: true, module: true },
              },
            },
          },
          users: {
            where: { isDeleted: false },
            select: { id: true, name: true, email: true, userName: true },
          },
        },
      },
    );
    return role;
  } catch (error) {
    throw createAppError(500, `Error__${error}`);
  }
};

//update Role Fun

export const updateRoleFun = async (req, roleId, newData) => {
  try {
    //check role found
    const isRoleFound = await crud.findById("role", roleId);
    if (!isRoleFound) throw createAppError(404, "Role_NotFound");
    //old data befor update
    const oldData = isRoleFound;

    //update role data using crud
    const updatedRole = await crud.updateById("role", roleId, newData);

    // ✅ register update role action
    await recordActivity(req, {
      action: "UPDATE_ROLE",
      module: "Role",
      recordId: roleId,
      description: `  تم تعديل دور: ${updatedRole.name}`,
      oldData,
      newData: updatedRole,
      status: "SUCCESS",
    });
    return updatedRole;
  } catch (error) {
    //  Register Update the role faild
    await recordActivity(req, {
      action: "UPDATE_ROLE",
      module: "Role",
      description: `فشل تعديل الدور `,
      status: "FAILED",
      errorMessage: error.message,
    });
    throw createAppError(500, `Error__${error}`);
  }
};

/**
 * Delete a role along with any associated role-permission links.
 * - Checks if the role has active permission assignments.
 * - If found, soft-deletes both the role and all linked rolePermission rows
 *   inside a single transaction (atomic — prevents orphaned links).
 * - If no permissions exist, just soft-deletes the role.
 */
export const softDeleteRoleWithPermissions = async (req, roleId) => {
  try {
    // 1. Verify role exists
    const isRoleFound = await crud.findById("role", roleId);
    if (!isRoleFound) throw createAppError(404, "Role_NotFound");

    // 2. Check for any active permission links on this role
    const linkedPermissions = await prisma.rolePermission.findMany({
      where: { roleId, isDeleted: false },
      select: { id: true },
    });

    // 3. Atomically soft-delete role + its rolePermission links (if any)
    const now = new Date();
    await prisma.$transaction([
      prisma.role.update({
        where: { id: roleId },
        data: { isDeleted: true, deletedAt: now },
      }),
      ...(linkedPermissions.length > 0
        ? [
            prisma.rolePermission.updateMany({
              where: { roleId, isDeleted: false },
              data: { isDeleted: true, deletedAt: now },
            }),
          ]
        : []),
    ]);

    // ✅ register delete role action
    await recordActivity(req, {
      action: "DELETE_ROLE",
      module: "Role",
      recordId: roleId,
      description: `تم حذف دور: ${isRoleFound.name} (مع ${linkedPermissions.length} صلاحية مرتبطة)`,
      oldData: isRoleFound,
      status: "SUCCESS",
    });

    return { success: true, removedPermissions: linkedPermissions.length };
  } catch (error) {
    await recordActivity(req, {
      action: "DELETE_ROLE",
      module: "Role",
      description: `فشل حذف الدور`,
      status: "FAILED",
      errorMessage: error.message,
    });
    if (error.isOperational) throw error;
    throw createAppError(500, `Error__${error}`);
  }
};
