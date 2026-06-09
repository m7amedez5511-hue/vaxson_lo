import { asyncHandler } from "../middleware/errorHandler.js";
import { getAllUsers } from "../services/user.service.js";
import {
  createNewUser,
  getUser,
  updateUserService,
  deleteUserService,
} from "../services/user.service.js";
import { signJwt } from "../utils/jwt.utils.js";
import { sendResponse } from "../utils/response.js";

/**
 * create user
 * @param sendUserData (req.body)
 * @return object {userData}
 * @generate userName and password
 * @send userName and password to user in whats app
 */

export const createUser = asyncHandler(async (req, res, next) => {
  //get user data from body req
  const userData = req.body;
  //get user data after created
  const result = await createNewUser(req, userData);
  //return respons to user
  sendResponse(res, 201, "Usar create successfuly", result);
});

/**
 * get all users and filter it by query
 */
export const getUsers = asyncHandler(async (req, res, next) => {
  const query = req.query;
  const result = await getAllUsers(query, false);
  //return respons to user
  sendResponse(res, 200, "users fetched successfully", result);
});

//getArchefedUsers
export const fetchArchivedUsers = asyncHandler(async (req, res, next) => {
  const query = req.query;
  const result = await getAllUsers(query, true);
  //return respons to user
  sendResponse(res, 200, "ArchivedUsers Fetched Successfully", result);
});
//getuser by id
export const getUserById = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  const result = await getUser(userId, false);
  //return respons to user
  sendResponse(
    res,
    200,
    "user fetched successfully",

    result,
  );
});
// get archived user by user Id
export const getArchivedUserById = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  const result = await getUser(userId, true);
  //return respons to user
  sendResponse(
    res,
    200,
    "archived user fetched successfully",

    result,
  );
});
//updated user data
export const updateUser = asyncHandler(async (req, res, next) => {
  const userData = req.body;
  const userId = req.params.id;
  const result = await updateUserService(req, userId, userData);
  //return respons to user
  sendResponse(res, 201, "user updated successfully", result);
});

//soft delete user data
export const softDeleteUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const result = await deleteUserService(req, userId);
  //return respons to user
  return res.status(204).send();
});

//get user info
export const userInfo = asyncHandler(async (req, res, next) => {
  //always fetch latest user data from database
  const user = await getUser(req.user.id, false);

  //return respons to user
  sendResponse(res, 200, "user fetched successfully", user);
});
