import { Router } from "express";
import * as TC from "../controllers/trip.controller.js";
import { validate } from "../middleware/validate.js";
import { tripValidator } from "../validators/trip.validator.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import tripReportRouter from "./trip-report.route.js";

const router = Router();

router.use(isAuthorized)

//create trip
router
  .route("/")
  .post(restrictTo("create-trip"),validate(tripValidator.createTrip), TC.createNewTrip)
  .get(restrictTo("read-trip"),TC.getAllTrips);//get all trips
  //archived ـــــــــــــــــــــــ
router.get("/archived",restrictTo("read-deleted-trip"),TC.fetchAllArchivedTrips)//get all archived trips
router.get("/archived/:id",restrictTo("read-deleted-trip"),TC.getArchivedTripById)//get archived trip by id
//ــــــــــــــ
router
  .route("/:id")
  .get(restrictTo("read-trip"),TC.getTripById) // grt trip by tripId
  .patch(restrictTo("update-trip"),validate(tripValidator.updateTrip), TC.updateTripById)//update trip by id
  .delete(restrictTo("delete-trip"),TC.deleteTripById);


// Mount reports for a specific trip
router.use("/:id/reports", tripReportRouter);

export default router;
