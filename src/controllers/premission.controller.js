import { asyncHandler } from "../middleware/errorHandler.js";
import { allPremission } from "../services/premission.service.js";
import { sendResponse } from "../utils/response.js";



export const getAllPremission = asyncHandler(async (req,res,next)=>{
    const searchQuery = req.query

    //get all premission
    const result = await allPremission(searchQuery)
    //return res
    sendResponse( 
    res,
    200,
    'Premission fetched successfully',
    {
      premissions :result
    })
})

