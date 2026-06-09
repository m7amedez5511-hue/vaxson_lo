import { prisma } from "../lib/prisma.js";
import { driverSelect } from "../selectors/dtiver.selector.js";
import { createAppError } from "../utils/createAppError.js";
import { generateUniqueString } from "../utils/generate-Unique-String.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import { isArabic, transliterateArabic } from "../utils/transliterateArabic.js";
import { recordActivity } from "./audit.service.js";
import * as crud from "./crud.service.js";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";


//generate url 
const getDriverImageUrl = (req, filename) => {
  if (!filename) return null;
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/public/uploads/driver-photos/${filename}`;
};
// add photo urls to drivers 
const mapDriverWithImageUrls = (req, driver) => ({
  ...driver,
  photoUrl: getDriverImageUrl(req, driver.photo),
  nationalPhotoUrl: getDriverImageUrl(req, driver.nationalPhoto),
  driverCardPhotoUrl: getDriverImageUrl(req, driver.driverCardPhoto),
});
//delete driver image
const deleteDriverPhotoFile = async (filename) => {
  if (!filename) return;
  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "driver-photos",
    filename,
  );
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};
//update driver image 
const cleanupReplacedDriverImages = async (oldDriver, updatedData) => {
  const imageFields = ["photo", "nationalPhoto", "driverCardPhoto"];
  for (const field of imageFields) {
    if (
      updatedData[field] &&
      oldDriver[field] &&
      updatedData[field] !== oldDriver[field]
    ) {
      await deleteDriverPhotoFile(oldDriver[field]);
    }
  }
};

//add new driver

export const addDriver = async (req, driverData) => {
  return await prisma.$transaction(async (tx) => {
    try {
      //check branch found
      const isBranchFound = await crud.findById("branch", driverData.branchId);
      if (!isBranchFound) throw createAppError(404, "Branch notFound");
      //create driver userName and password
      //generate roundom name
      const roundomName = generateUniqueString(5);
      //generate userName Password
      //name from driver data
      const name = driverData.name;
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

      const driver = await tx.driver.create({
        data: {
          ...driverData,
          password: hashPassword,
          userName,
        },
        select: driverSelect,
      });

      //create DriverStatusHistory

      const createDriverHistory = await tx.driverStatusHistory.create({
        data: {
          driverId: driver.id,
          status: driver.status,
        },
      });

      // ✅   Register adding the driver
      await recordActivity(req, {
        action: "CREATE_DRIVER",
        module: "Driver",
        recordId: driver.id,
        description: `تم إضافة سائق جديد: ${driver.name} (${driver.userName})`,
        newData: driver,
        status: "SUCCESS",
      });

      return mapDriverWithImageUrls(req, driver);
    } catch (error) {
      //  Register adding the driver faild
      await recordActivity(req, {
        action: "CREATE_DRIVER",
        module: "Driver",
        description: `فشل إضافة سائق جديد`,
        status: "FAILED",
        errorMessage: error.message,
      });
      throw error;
    }
  });
};

//get all drivers
export const fetchDrivers = async (req, query, deleted) => {
  const features = new PrismaFeatures(prisma.driver, query)
    .filter()
    .search([
      "name",
      "email",
      "phone",
      "userName",
      "adress",
      "nationality",
      "nationalIdType",
      "gosiNumber",
      "licenseNumber",
      "licenseType",
      "licenseExpiry",
      "driverCardNumber",
      "driverCardType",
      "driverCardExpiry",
      "driverType",
      "status",
      "branch",
    ])
    .sort()
    .paginate();

  features.queryOptions.where = {
    ...features.queryOptions.where,
    isDeleted: deleted,
  };
  //features.queryOptions.select = driverSelect.select;
  //remove password from respons

  features.queryOptions.select = driverSelect;
  const result = await features.exec();

  return {
    ...result,
    data: result.data.map((driver) => mapDriverWithImageUrls(req, driver)),
  };
};

//fetch driver by using id
export const fetchDriverById = async (req, driverId, deleted) => {
  //check driver found
  const isDriverFound = await crud.fetchOne(
    "driver",
    { id: driverId, isDeleted: deleted },
    {
      select: {
        ...driverSelect,
        branch: { select: { name: true } },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    },
  );
  if (!isDriverFound) throw createAppError(404, "Driver NotFound ");
  //return driver without password for securrty
  const { password: _, ...driverWithoutPassword } = isDriverFound;
  //return driver
  return mapDriverWithImageUrls(req, driverWithoutPassword);
};

//fetch current driver info based on authenticated user identifiers
export const fetchDriverInfoByAuthUser = async (req, authUser) => {
  const driver = await prisma.driver.findFirst({
    where: {
      isDeleted: false,
      OR: [
        authUser.userName ? { userName: authUser.userName } : undefined,
        authUser.phone ? { phone: authUser.phone } : undefined,
        authUser.email ? { email: authUser.email } : undefined,
      ].filter(Boolean),
    },
    select: {
      ...driverSelect,
      branch: { select: { name: true } },
      statusHistory: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });

  if (!driver) throw createAppError(404, "Driver NotFound");
  const { password: _, ...driverWithoutPassword } = driver;
  return mapDriverWithImageUrls(req, driverWithoutPassword);
};

//update driver data
export const updateDriverData = async (req, driverId, updatedData) => {
  let oldDriverSnapshot = null;
  const updatedDriver = await prisma.$transaction(async (tx) => {
    try {
      //check driver found
      const isDriverFound = await crud.findById("driver", driverId);
      if (!isDriverFound) throw createAppError(404, "Driver NotFound");
      oldDriverSnapshot = isDriverFound;
      //save old data befor edit
      const { password: _, ...oldData } = isDriverFound; // ← old snapshot

      //check status
      if (updatedData.status) {
        //check new status != driverStatus
        if (updatedData.status != isDriverFound.status) {
          await tx.driverStatusHistory.create({
            data: {
              driverId: isDriverFound.id,
              status: updatedData.status,
              reason: updatedData.reason,
            },
          });
        }
      }
      //if need change status to in trip update current trip status to in trip
      if (
        updatedData.status === "InTrip" &&
        isDriverFound.status !== "InTrip"
      ) {
        // Update the status of the current trip to "InTrip"
        await tx.trip.updateMany({
          where: {
            driverId: isDriverFound.id,
            status: { not: "InTrip" },
          },
          data: { status: "InTrip" },
        });
      }
      //check if driver need change branch
      if (updatedData.branchId && updatedData.branchId !== isDriverFound.branchId) {
        //check branch found
        const isBranchFound = await crud.findById("branch", updatedData.branchId);
        if (!isBranchFound) throw createAppError(404, "Branch notFound");
      }
      //check if driver send name
      

      const updatedDriver = await tx.driver.update({
        where: { id: driverId },
        data: updatedData,
        select: driverSelect,
      });

      // ✅ save action and comber between oldData and newData
      await recordActivity(req, {
        action: "UPDATE_DRIVER",
        module: "Driver",
        recordId: driverId,
        description: `تم تعديل بيانات السائق: ${updatedDriver.name}`,
        oldData, // ←  old data
        newData: updatedDriver, // ←   new data
        status: "SUCCESS",
      });
      return updatedDriver;
    } catch (error) {
      //  Register update the driver faild
      await recordActivity(req, {
        action: "UPDATE_DRIVER",
        module: "Driver",
        description: `فشل تعدسل السائق `,
        status: "FAILED",
        errorMessage: error.message,
      });
      throw error;
    }
  });

  await cleanupReplacedDriverImages(oldDriverSnapshot, updatedData);
  return mapDriverWithImageUrls(req, updatedDriver);
};

//soft delete driver
export const deleteDriver = async (req, driverId) => {
  try {
    //check driver found
    const isDriverFound = await crud.findById("driver", driverId);
    if (!isDriverFound) throw createAppError(404, "Driver NotFound");

    //delete driver
    const delted = await crud.softDelete("driver", driverId);
    // ✅  REGISTER DELTE
    await recordActivity(req, {
      action: "DELETE_DRIVER",
      module: "Driver",
      recordId: driverId,
      description: `تم حذف السائق: ${isDriverFound.name}`,
      oldData: isDriverFound,
      status: "SUCCESS",
    });

    await Promise.all([
      deleteDriverPhotoFile(isDriverFound.photo),
      deleteDriverPhotoFile(isDriverFound.nationalPhoto),
      deleteDriverPhotoFile(isDriverFound.driverCardPhoto),
    ]);

    return delted;
  } catch (error) {
    //  Register delete the driver faild
    await recordActivity(req, {
      action: "DELETE_DRIVER",
      module: "Driver",
      description: `فشل حزف السائق `,
      status: "FAILED",
      errorMessage: error.message,
    });
    throw error;
  }
};
// Get archived status history for driver
export const getArchivedCarStatusHistory = async (driverId, query) => {
  const features = new PrismaFeatures(prisma.driverStatusHistory, query)
    .filter()
    .sort()
    .paginate();

  features.queryOptions.where = {
    ...features.queryOptions.where,
    driverId,
    isDeleted: true,
  };

  return await features.exec();
};

// Soft delete a driver status history record
export const softDeleteDriverStatusHistory = async (req, historyId) => {
  try {
    const history = await prisma.driverStatusHistory.update({
      where: { id: historyId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await recordActivity(req, {
      action: "DELETE_DRIVER_STATUS_HISTORY",
      module: "Driver",
      recordId: historyId,
      description: `حذف سجل حالة السائق`,
      oldData: history,
      status: "SUCCESS",
    });
  } catch (error) {
    throw error;
  }
};

//find drivers with documents expiring within specific windows
export const findDriversForExpiry = async ({ pre, post, statuses }) => {
  return prisma.driver.findMany({
    where: {
      isDeleted: false,
      isActive: true,
      status: { in: statuses },
      OR: [
        { nationalIdExpiry: { gte: pre.from,  lte: pre.to  } },
        { nationalIdExpiry: { gte: post.from, lte: post.to } },
        { licenseExpiry:    { gte: pre.from,  lte: pre.to  } },
        { licenseExpiry:    { gte: post.from, lte: post.to } },
      ],
    },
    select: { id: true, name: true, phone: true, nationalIdExpiry: true, licenseExpiry: true },
  });
};