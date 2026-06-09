import { asyncHandler } from "../middleware/errorHandler.js";
import { newTrip ,fetchAllTrips ,fetchTripById, updateTrip,deleteTrip } from "../services/trip.service.js";
import { sendResponse } from "../utils/response.js";


//create trip func
export const createNewTrip = asyncHandler(async (req,res,next)=>{

    const tripData = req.body
    //fetch data from service layer
    const result = await newTrip(req,tripData)
    //return res
    sendResponse(res,201,"Trip create successfuly",result)
})

//fetch all trip

export const getAllTrips = asyncHandler(async (req,res,next)=>{
    //destract query
    const query = req.query
    //fetch all trips
    const result = await fetchAllTrips(query,false)
    //send res
    sendResponse(res,200,"Trips fetched saccessfuly",result)
})
//fetch all archived trips
export const fetchAllArchivedTrips = asyncHandler(async (req,res,next)=>{
    //destract query
    const query = req.query
    //fetch all trips
    const result = await fetchAllTrips(query,true)
    //send res
    sendResponse(res,200,"Arvhived Trips fetched saccessfuly",result)
})
//fetch trip by id
export const getTripById = asyncHandler(async  (req,res,next)=>{
    //destract tripId from params
    const tripId =req.params.id
    //get result from service layer
    const result = await fetchTripById(tripId,false)
//send res
    sendResponse(res,200,"Trip fetched saccessfuly",result)
})
//fetch archived trip by id
export const getArchivedTripById = asyncHandler(async  (req,res,next)=>{
    //destract tripId from params
    const tripId =req.params.id
    //get result from service layer
    const result = await fetchTripById(tripId,true)
//send res
    sendResponse(res,200,"Archived Trip fetched saccessfuly",result)
})
//update trip 

export const updateTripById = asyncHandler(async  (req,res,next)=>{
    //destract tripId from params
    const tripId =req.params.id
    //destract trip data
    const tripdata = req.body
    //get result from service layer
    const result = await updateTrip(req,tripId,tripdata)
//send res
    sendResponse(res,200,"Trip updated saccessfuly",result)
})

//delete trip
export const deleteTripById =asyncHandler(async  (req,res,next)=>{
    //destract tripId from params
    const tripId =req.params.id
    //get result from service layer
    const result = await deleteTrip(req,tripId)
//send res
    res.status(204).send()
})