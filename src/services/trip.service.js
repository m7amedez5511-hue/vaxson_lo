import { prisma } from "../lib/prisma.js";
import { createAppError } from "../utils/createAppError.js";
import { PrismaFeatures } from "../utils/PrismaFeatures.js";
import * as crud from "./crud.service.js";
import { generateUniqueString } from "../utils/generate-Unique-String.js";
import { recordActivity } from "./audit.service.js";
import { tripSelect } from "../selectors/trip.selector.js";

//create new trip
export const newTrip = async (req,tripData) => {
 
  return await prisma.$transaction(async (tx) => {
   try {
      // ── Driver: check + update inside the same tx (fixes TOCTOU) ──
    const isDriverFound = await tx.driver.findFirst({
      where: { id: tripData.driverId, status: "Active" },
    });
    if (!isDriverFound)
      throw createAppError(404, "driver notFound or not Active");
    //create driver history
    await tx.driverStatusHistory.create({
      data: {
        driverId: tripData.driverId,
        status: "InTrip",
      },
    });
    //update driver status
    await tx.driver.update({
      where: { id: isDriverFound.id },
      data: { status: "InTrip" },
    });

    // ── Car: check + update inside the same tx (fixes TOCTOU) ──
    const isCarFound = await tx.car.findFirst({
      where: { id: tripData.carId, currentStatus: "Active" },
    });
    if (!isCarFound) throw createAppError(404, "Car notFound or not Active");
    //create car history
    await tx.carStatusHistory.create({
      data: {
        carId: tripData.carId,
        carStatus: "InTrip",
      },
    });
    //update car status
    await tx.car.update({
      where: { id: isCarFound.id },
      data: { currentStatus: "InTrip" },
    });

    // ── Branch: check inside the same tx ──
    const isBranchFound = await tx.branch.findUnique({ where: { id: tripData.branchId } });
    if (!isBranchFound) throw createAppError(404, "Branch notFound");

    //trip starttime
    const startTime = tripData.startTime || new Date();
    //create trip number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const tripNumber = `TRIP-${year}${month}${day}-${generateUniqueString(5)}`;
    //create trip

    const trip = await tx.trip.create({
      data: {
        ...tripData,
        startTime,
        tripNumber
      },
      select: {
        ...tripSelect,
        car: {
          select: {
            manufacturer: true,
            model: true,
            year: true,
            color: true,
            plateNumber: true,
            plateLetters: true,
            plateType: true,
          },
        },
        driver: {
          select: {
            name: true,
            userName: true,
            email: true,
            address: true,
            nationality: true,
            gosiNumber: true,
            phone: true,
            licenseNumber: true,
          },
        },
        branch:{
          select:{
            name:true
          }
        }
      },
    });
    //create audit
    await recordActivity(req, {
      action: "CREATE_TRIP",
      module: "Trip",
      recordId: trip.id,
      description: `تم إنشاء رحلة جديدة: ${trip.tripNumber} - السائق: ${trip.driver?.name}`,
      newData: trip,
      status: "SUCCESS"
    });
    return trip;
   } catch (error) {
    //  Register add the trip faild
    await recordActivity(req, {
      action: "CREATE_TRIP",
      module: "Trip",
      description: `فشل أضاغة الرحلة `,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error
   }
  }, {
    // Serializable isolation is the DB-level safety net:
    // even if two transactions pass the findFirst check simultaneously,
    // one will be forced to retry/abort rather than both committing.
    isolationLevel: "Serializable",
  });
};

//get all trips
export const fetchAllTrips = async (query,deleted) => {
  const features = new PrismaFeatures(prisma.trip, query)
    .filter(["status", "driverId", "carId", "branchId"])
    .search(["carId", "driverId", "tripNumber", "status","title"])
    .sort(["createdAt", "tripNumber", "status", "startTime", "endTime"])
    .paginate();

  features.queryOptions.where = {
    ...features.queryOptions.where,
    isDeleted: deleted,
  };
  features.selectOrInclude(tripSelect);
  const result = await features.exec();

  return result;
};

//fetch trip using id
export const fetchTripById = async (tripId,deleted) => {
  //check trip found
  const isTripFound = await crud.fetchOne("trip", {id:tripId,isDeleted:deleted}, {
    select: {
      ...tripSelect,
      car: {
        select: {
          id: true,
          manufacturer: true,
          model: true,
          year: true,
          color: true,
          plateNumber: true,
          plateLetters: true,
          registrationNumber: true,
          ownerNationalId: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          userName: true,
          email: true,
          address: true,
          nationality: true,
          nationalId: true,
          gosiNumber: true,
          phone: true,
          licenseNumber: true,
          driverCardNumber: true,
        },
      },
    },
  });
  if (!isTripFound) throw createAppError(404, "Trip Not Found");
  return isTripFound;
};

//update trip
export const updateTrip = async (req,tripId, tripData) => {
  return prisma.$transaction(async (tx) => {
   try {
     // ── Trip existence check inside tx (fixes TOCTOU) ──
    const isTripFound = await tx.trip.findUnique({ where: { id: tripId } });
    if (!isTripFound) throw createAppError(404, "Trip Not Found");
    //old data for audit
    const oldData = isTripFound;

    //check if need change driver
    if (tripData.driverId && tripData.driverId !== isTripFound.driverId) {
      // ── New driver: check availability inside tx (fixes TOCTOU) ──
      const driver = await tx.driver.findFirst({
        where: { id: tripData.driverId, status: "Active" },
      });
      if (!driver)
        throw createAppError(404, "Driver Not Found , or not Active");

      const updateDriverStatus = await tx.driver.update({
        where: { id: tripData.driverId },
        data: { status: "InTrip" },
      });
      //update old driver status
      const oldDriver = await tx.driver.update({
        where: { id: isTripFound.driverId },
        data: { status: "Active" },
      });
      //new driver History
      const newDriverHistory = await tx.driverStatusHistory.create({
        data: {
          driverId: tripData.driverId,
          status: "InTrip",
          reason: tripData.reason || "He was assigned to a trip",
        },
      });
      //old driver histoy
      const oldDriverHistory = await tx.driverStatusHistory.create({
        data: {
          driverId: isTripFound.driverId,
          status: "Active",
          reason: tripData.reason || "The company needs him for another job",
        },
      });
      //audit create
      await recordActivity(req, {
        action: "CHANGE_TRIP_DRIVER",
        module: "Trip",
        recordId: tripId,
        description: `تم تغيير السائق في الرحلة ${isTripFound.tripNumber} - من: ${isTripFound.driverId} إلى: ${tripData.driverId}`,
        oldData: { driverId: isTripFound.driverId },
        newData: { driverId: tripData.driverId },
        status: "SUCCESS"
      });
    }

    //check if need change car
    if (tripData.carId && tripData.carId !== isTripFound.carId) {
      // ── New car: check availability inside tx (fixes TOCTOU) ──
      const car = await tx.car.findFirst({
        where: { id: tripData.carId, currentStatus: "Active" },
      });
      if (!car) throw createAppError(404, "car Not Found or car not Active");

      const updateCarStatus = await tx.car.update({
        where: { id: tripData.carId },
        data: { currentStatus: "InTrip" },
      });
      //update old car status
      const updateOldCarStatus = await tx.car.update({
        where: { id: isTripFound.carId },
        data: { currentStatus: "Active" },
      });
      //create newCar history
      const newCarHistory = await tx.carStatusHistory.create({
        data: {
          carId: tripData.carId,
          carStatus: "InTrip",
        },
      });
      //create old car history
      const oldCarHistory = await tx.carStatusHistory.create({
        data: {
          carId: isTripFound.carId,
          carStatus: "Active",
        },
      });
      //audit if car change
       await recordActivity(req, {
        action: "CHANGE_TRIP_CAR",
        module: "Trip",
        recordId: tripId,
        description: `تم تغيير السيارة في الرحلة ${isTripFound.tripNumber} - من: ${isTripFound.carId} إلى: ${tripData.carId}`,
        oldData: { carId: isTripFound.carId },
        newData: { carId: tripData.carId },
        status: "SUCCESS"
      });
    }
    //check status
    const checkStatus =
      (tripData.status == "Completed" || tripData.status == "Cancelled") &&
      tripData.status != isTripFound.status;
    if (checkStatus) {
      //change driver status
      await tx.driver.update({
        where: { id: isTripFound.driverId },
        data: { status: "Active" },
      });
      //create driver history
      await tx.driverStatusHistory.create({
        data: {
          driverId: isTripFound.driverId,
          status: "Active",
        },
      });

      //change car status
      await tx.car.update({
        where: { id: isTripFound.carId },
        data: { currentStatus: "Active" },
      });
      //create car history
      await tx.carStatusHistory.create({
        data: {
          carId: isTripFound.carId,
          carStatus: "Active",
        },
      });
      //audit if status change
      await recordActivity(req, {
        action: `TRIP_${tripData.status.toUpperCase()}`,
        module: "Trip",
        recordId: tripId,
        description: `تم ${tripData.status === "Completed" ? "إنهاء" : "إلغاء"} الرحلة: ${isTripFound.tripNumber}`,
        oldData: { status: isTripFound.status },
        newData: { status: tripData.status },
        status: "SUCCESS"
      });
    }
    //if need change branch
    if (tripData.branchId && tripData.branchId !== isTripFound.branchId) {
      // ── Branch: check inside tx ──
      const isBranchFound = await tx.branch.findUnique({ where: { id: tripData.branchId } });
      if (!isBranchFound) throw createAppError(404, "Branch notFound");
    }
    //update trip

    const updateTrip = await tx.trip.update({
      where: { id: tripId },
      data: {
        ...tripData,
      },
      select: {
        ...tripSelect,
        car: {
          select: {
            manufacturer: true,
            model: true,
            year: true,
            color: true,
            plateNumber: true,
            plateLetters: true,
            plateType: true,
          },
        },
        driver: {
          select: {
            name: true,
            userName: true,
            email: true,
            address: true,
            nationality: true,
            gosiNumber: true,
            phone: true,
            licenseNumber: true,
          },
        },
        branch:{
          select:{
            name:true
          }
        }
      },
    });
    //create audit
    await recordActivity(req, {
      action: "UPDATE_TRIP",
      module: "Trip",
      recordId: tripId,
      description: `تم تعديل الرحلة: ${isTripFound.tripNumber}`,
      oldData,
      newData: updateTrip,
      status: "SUCCESS"
    });
    return updateTrip;
   } catch (error) {
    //  Register update the trip faild
    await recordActivity(req, {
      action: "UPDATE_TRIP",
      module: "Trip",
      description: `فشل تعديل الرحلة `,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error
   }
  }, {
    isolationLevel: "Serializable",
  });
};

//soft delete trip
export const deleteTrip = async (req,tripId) => {
  try {
    const trip = await prisma.trip.update({
    where: { id: tripId, isDeleted: false },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
  //audit if trip delete
  await recordActivity(req, {
    action: "DELETE_TRIP",
    module: "Trip",
    recordId: tripId,
    description: `تم حذف الرحلة: ${trip.tripNumber}`,
    oldData: trip,
    status: "SUCCESS"
  });
  return trip;
  } catch (error) {
    
    //  Register delete the trip faild
    await recordActivity(req, {
      action: "DELETE_TRIP",
      module: "Trip",
      description: `فشل حزف الرحلة `,
      status: "FAILED",
      errorMessage: error.message
    });
    throw error
  }
};