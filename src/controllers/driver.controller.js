import { asyncHandler } from "../middleware/errorHandler.js";
import {
  addDriver,
  fetchDrivers,
  fetchDriverById,
  fetchDriverInfoByAuthUser,
  updateDriverData,
  deleteDriver,
  softDeleteDriverStatusHistory,
} from "../services/driver.service.js";
import { createAppError } from "../utils/createAppError.js";
import { sendResponse } from "../utils/response.js";

const mapUploadedDriverImages = (reqBody, files = {}) => {
  const mappedBody = { ...reqBody };
  if (files?.photo?.[0]) mappedBody.photo = files.photo[0].filename;
  if (files?.nationalPhoto?.[0]) {
    mappedBody.nationalPhoto = files.nationalPhoto[0].filename;
  }
  if (files?.driverCardPhoto?.[0]) {
    mappedBody.driverCardPhoto = files.driverCardPhoto[0].filename;
  }
  return mappedBody;
};
/**
 * create driver
 * @param {name,email,adress,nationality,nationaltyTypr,gosiNumber,phone,licens,...}
 *
 */

export const createDriver = asyncHandler(async (req, res, next) => {
  //uploade driver photo
  const driverData = mapUploadedDriverImages(req.body, req.files);
  //send data to services layer
  const result = await addDriver(req, driverData);
  //return res
  sendResponse(res, 201, "driver add successfuly", result);
});

//get all drivers

export const getAllDriver = asyncHandler(async (req, res, next) => {
  //destract query to search
  const query = req.query;
  const result = await fetchDrivers(req, query, false);
  //return res
  sendResponse(res, 200, "drivers fetch successfuly", result);
});
// Get Archived Drivers
export const fetchArchivedDrivers = asyncHandler(async (req, res, next) => {
  //destract query to search
  const query = req.query;
  const result = await fetchDrivers(req, query, true);
  //return res
  sendResponse(res, 200, "Archived Drivers fetch successfuly", result);
});

//get driver by id
export const getDriverById = asyncHandler(async (req, res, next) => {
  const driverId = req.params.id;
  //fetch driver services layer
  const result = await fetchDriverById(req, driverId, false);
  //return res
  sendResponse(res, 200, "driver fetch successfuly", result);
});

//get current driver info (linked to authenticated user data)
export const driverInfo = asyncHandler(async (req, res, next) => {
  const result = await fetchDriverInfoByAuthUser(req, req.user);
  sendResponse(res, 200, "driver fetched successfully", result);
});
//get archive driver by id
export const getArchivedDriverById = asyncHandler(async (req, res, next) => {
  const driverId = req.params.id;
  //fetch driver services layer
  const result = await fetchDriverById(req, driverId, true);
  //return res
  sendResponse(res, 200, "driver fetch successfuly", result);
});
//update driver by id
export const updateDriver = asyncHandler(async (req, res, next) => {
  const driverId = req.params.id;
  //fetch updateData from req.body
  const updateData = mapUploadedDriverImages(req.body, req.files);
  //get result from services layer
  const result = await updateDriverData(req, driverId, updateData);
  //return res
  sendResponse(res, 200, "driver updated successfuly", result);
});

//soft delete driver
export const softDeleteDriver = asyncHandler(async (req, res, next) => {
  const driverId = req.params.id;

  await deleteDriver(req, driverId);
  //return respons to user
  return res.status(204).send();
});

//Driver Status ـــــــــــــــــــــــــــــــــ

// Get archived status history for driver
export const fetchArchivedDriverStatusHistory = asyncHandler(
  async (req, res, next) => {
    const driverId = req.params.id;
    //destract query to search
    const query = req.query;
    const result = await getArchivedCarStatusHistory(driverId, query);
    //return res
    sendResponse(
      res,
      200,
      "archived driver status history fetch successfuly",
      result,
    );
  },
);

// Soft delete a driver status history record
export const deleteDriverStatusHistory = asyncHandler(
  async (req, res, next) => {
    //fetch history id
    const historyId = req.params.id;

    const result = await softDeleteDriverStatusHistory(req, historyId);
    res.status(204).send();
  },
);
