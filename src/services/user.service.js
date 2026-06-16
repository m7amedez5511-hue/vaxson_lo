import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import * as crud from "./crud.service.js";
import bcrypt from "bcryptjs";
import { generateUniqueString } from "../utils/generate-Unique-String.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { isArabic, transliterateArabic } from "../utils/transliterateArabic.js";
import { recordActivity } from "./audit.service.js";
import { queueSmsBulk } from "./sms-queue.service.js";
import { userSelect } from "../selectors/user.selector.js";

/**
 * create user
 */
export const createNewUser = async (req, userData) => {
  try {
    const { name, email, phone, roleId, branchId } = userData;
    //check role found
    const isRoleFound = await crud.findById("role", roleId);
    if (!isRoleFound) throw createAppError(404, "Role notFound");
    //check branch found
    const isBranchFound = await crud.findById("branch", branchId);
    if (!isBranchFound) throw createAppError(404, "Branch notFound");
    //generate roundom name
    const roundomName = generateUniqueString(5);
    //crezte first name
    const firstName = name.trim().split(" ")[0];

    //check if name is arabic or engish
    let userName;
    if (isArabic(firstName)) {
      const transliteratedName = transliterateArabic(firstName);
      userName = `${transliteratedName}_${roundomName}`;
    } else {
      userName = `${firstName.toLowerCase()}_${roundomName}`;
    }
    //create roundom password
    const roundomPassword = generateUniqueString(8);

    //hash Password
    const salt = await bcrypt.genSalt(9);
    const hashPassword = await bcrypt.hash(roundomPassword, salt);

    
    //create new user
    const user = await crud.create(
      "user",
      {
        ...userData,
        userName,
        password: hashPassword,
      },
      {
        select: {
          ...userSelect,
          role: {
            select: {
              name: true,
              description: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      name: true,
                      slug: true,
                      module: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    );
    if (!user) throw createAppError(400, "user.create_failed");

    // ✅ audit
    await recordActivity(req, {
      action: "CREATE_USER",
      module: "User",
      recordId: user.id,
      description: `تم إنشاء مستخدم جديد: ${user.name} (${user.userName})`,
      newData: user,
      status: "SUCCESS",
    });
    //send userName and password to user whats app
    try {
     const count = await queueSmsBulk([
        {
          phone: user.phone,
          message: `معلوماتك الشخصية Username: ${userName}, Password: ${roundomPassword}`,
        },
      ]);
      
    
    } catch (err) {
      await recordActivity(req, {
        action: "CREATE_USER_SMS_QUEUE_FAILED",
        module: "User",
        recordId: user.id,
        description: `فشل أرسال رسالة للمستخدم ${user.userName}`,
        status: "FAILED",
        errorMessage: err.message,
      });
    }
    return user;
  } catch (error) {
    //  Register add the user faild
    await recordActivity(req, {
      action: "CREATE_USER",
      module: "User",
      description: `فشل أضاغة المستخدم `,
      status: "FAILED",
      errorMessage: error.message,
    });
    throw error;
  }
};

//get all users
export const getAllUsers = async (query, deleted) => {
  const features = new PrismaFeatures(prisma.user, query)
    .filter(["isActive", "roleId", "branchId"])
    .search(["name", "email", "phone", "userName"])
    .sort(["createdAt", "name", "isActive"])
    .paginate();

  features.queryOptions.where = {
    ...features.queryOptions.where,
    isDeleted: deleted,
  };
  //remove password from respons
  features.selectOrInclude(userSelect);
  const result = await features.exec();

  return result;
};

//get user by id

export const getUser = async (userId, deleted) => {
  //get user
  const user = await crud.fetchOne(
    "user",
    { id: userId, isDeleted: deleted },
    {
      select: {
        ...userSelect,
        role: {
          select: {
            name: true,
            description: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                    slug: true,
                    module: true,
                  },
                },
              },
            },
            isActive: true,
            isDeleted: true,
          },
        },
        branch: { select: { name: true } },
      },
    },
  );
  if (!user) throw createAppError(404, "user notFound");
  // Remove password from returned user object
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

//update user

export const updateUserService = async (req, userId, userData) => {
  try {
    //check user is found
    const isUserFound = await crud.findById("user", userId);
    
    
    if (!isUserFound) throw createAppError(404, "User NotFound");
    //create old data for audit
    const { password: _, ...oldData } = isUserFound;

    //check if user need to change role
    if (userData.roleId && userData.roleId !== isUserFound.roleId) {
      //check role found
      const isRoleFound = await crud.findById("role", userData.roleId);
      if (!isRoleFound) throw createAppError(404, "Role notFound");
    }
    //check if user need to change branch
    if (userData.branchId && userData.branchId !== isUserFound.branchId) {
      //check branch found
      const isBranchFound = await crud.findById("branch", userData.branchId);
      if (!isBranchFound) throw createAppError(404, "Branch notFound");
    }
   
    //update data
    const userUpdate = await crud.updateById("user", userId, userData, {
      select: userSelect,
    });

    // ✅ audit
    await recordActivity(req, {
      action: "UPDATE_USER",
      module: "User",
      recordId: userId,
      description: `تم تعديل بيانات المستخدم: ${userUpdate.name}`,
      oldData,
      newData: userUpdate,
      status: "SUCCESS",
    });
    return userUpdate;
  } catch (error) {
    //  Register uodate the user faild
    await recordActivity(req, {
      action: "UPDATE_USER",
      module: "User",
      description: `فشل تعديل المستخدم `,
      status: "FAILED",
      errorMessage: error.message,
    });
    throw error;
  }
};

//delet user soft delet

export const deleteUserService = async (req, userId) => {
  try {
    //check user is found
    const isUserFound = await crud.findById("user", userId);
    if (!isUserFound) throw createAppError(404, "User NotFound");

    //soft delete user
    const deletedUser = await crud.softDelete("user", userId);
    //check if user deleted
    if (deletedUser.isDeleted == false || deletedUser.deletedAt == null)
      throw createAppError(500, "user_deleted_faild ");
    // ✅ audit
    await recordActivity(req, {
      action: "DELETE_USER",
      module: "User",
      recordId: userId,
      description: `تم حذف المستخدم: ${isUserFound.name} (${isUserFound.userName})`,
      oldData: isUserFound,
      status: "SUCCESS",
    });
    return deletedUser;
  } catch (error) {
    //  Register delete the user faild
    await recordActivity(req, {
      action: "DELETE_USER",
      module: "User",
      description: `فشل حزف المستخدم `,
      status: "FAILED",
      errorMessage: error.message,
    });
    throw error;
  }
};