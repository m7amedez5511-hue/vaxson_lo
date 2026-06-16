import { createAppError } from "../utils/createAppError.js";
import { recordActivity } from "./audit.service.js";
import * as crud from "./crud.service.js";
import bcrypt from "bcryptjs";

const userSelect = {
  id: true,
  name: true,
  email: true,
  password: true,
  userName: true,
  phone: true,
  photo: true,
  roleId: true,
  role: true,
  branchId: true,
  branch: true,
  refreshToken: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
  passwordChangedAt: true,
};

/**
 * login Function
 */

export const loginFun = async (req, loginData) => {
  let user = null;
  try {
    // Build dynamic where condition login user with {userName , email ,phone}
    const whereCondition = loginData.userName
      ? { userName: loginData.userName }
      : loginData.email
        ? { email: loginData.email }
        : { phone: loginData.phone };

    // Find user by userName or phone
    user = await crud.findOne("user", whereCondition, {
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
    });

    if (!user) {
      throw createAppError(401, "User_Not_Found");
    }
    // Check password
    const isPasswordMatch = await bcrypt.compare(
      loginData.password,
      user.password,
    );
    if (!isPasswordMatch) {
      // ❌ login faild : password Incorrect
      await recordActivity(req, {
        action: "LOGIN_FAILED",
        module: "User",
        recordId: user.id,
        userId: user.id,
        description: `محاولة تسجيل دخول فاشلة - كلمة المرور غير صحيحة`,
        status: "FAILED",
        errorMessage: "Password_Incorrect",
      });
      throw createAppError(401, "Password_Incorrect");
    }
   
      // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    // ✅  login success
    await recordActivity(req, {
      action: "LOGIN_SUCCESS",
      module: "User",
      recordId: user.id,
      userId: user.id,
      newData: userWithoutPassword,
      description: `تسجيل دخول ناجح للمستخدم: ${user.name || user.phone}`,
      status: "SUCCESS",
    });

  
    return userWithoutPassword;
  } catch (error) {
    try {
      await recordActivity(req, {
        action: "LOGIN_FAILED",
        module: "User",
        recordId: user?.id ,
        userId: user?.id,
        newData: userWithoutPassword,
        description: `محاولة تسجيل دخول فاشلة: ${loginData.name}}`,
        status: "FAILED",
        errorMessage: error.message,
      });
    } catch (auditErr) {
      console.error("audit failed to record login failure:", auditErr.message);
    }
    throw error;
  }
};
