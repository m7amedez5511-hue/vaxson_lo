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
export const getAllMatchRole = async (query,deleted) => {
  const features = new PrismaFeatures(prisma.role, query)
    .filter()
    .search(["name", "description"])
    .sort()
    .paginate();

  features.queryOptions.where = {
    ...features.queryOptions.where,
    isDeleted: deleted,
  };

  const result = await features.exec();

  return result;
};

export const getRoleById = async (roleId,deleted) => {
  try {
    //get role py using roleID using crud
    const role = await crud.fetchOne("role", {id:roleId,isDeleted:deleted},
    {select:{id:true,name:true,description:true,createdAt:true,updatedAt:true ,userRoles:{where:{isDeleted:false},select:{permission:{where:{isDeleted:false},select:{id:true,name:true}}}} }}
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

///soft delete
export const softDeleteRole = async (req, roleId) => {
  try {
    //check role found
    //check role found
    const isRoleFound = await crud.findById("role", roleId);
    if (!isRoleFound) throw createAppError(404, "Role_NotFound");

    //soft delet this role
    const isDeletedRole = await crud.softDelete("role", roleId);
    // ✅ register delete role action
    await recordActivity(req, {
      action: "DELETE_ROLE",
      module: "Role",
      recordId: roleId,
      description: `  تم حزف دور`,
      oldData: isRoleFound,
      status: "SUCCESS",
    });
    if (isDeletedRole.isDeleted == false) return isDeletedRole;
  } catch (error) {
    //  Register delete the role faild
    await recordActivity(req, {
      action: "DELETE_ROLE",
      module: "Role",
      description: `فشل حزف الدور `,
      status: "FAILED",
      errorMessage: error.message,
    });
    throw createAppError(500, `Error__${error}`);
  }
};
///hard delete
export const hardDeleteRole = async (roleId) => {
  try {
    //check role found
    //check role found
    const isRoleFound = await crud.findById("role", roleId);
    if (!isRoleFound) throw createAppError(404, "Role_NotFound");

    //soft delet this role
    const isDeletedRole = await crud.hardDelete("role", roleId);
    return isDeletedRole;
  } catch (error) {
    throw createAppError(500, `Error__${error}`);
  }
};

