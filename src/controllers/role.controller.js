import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { newRole ,getAllMatchRole, getRoleById ,updateRoleFun, softDeleteRoleWithPermissions} from "../services/role.service.js";
import { sendResponse } from "../utils/response.js";

/**
 * create role
 */

export const createRole = asyncHandler(async (req,res,next)=>{
    const roleData = req.body 
    
    //using fun from services layer to create branch
    const result = await newRole(req,roleData)

    //return res
    sendResponse(res, 201, "role Create successfuly", result)
})


//get all role 

export const allRoles = asyncHandler(async (req,res,next)=>{

    const searchQuery = req.query

    //send query to services layer to return data to busniss layer
    const result  = await getAllMatchRole(searchQuery,false)

    //return res to front
    sendResponse(res, 200, "roles  fetched successfully", result)

})
//get all archived role 

export const fetchArchivedRoles = asyncHandler(async (req,res,next)=>{

    const searchQuery = req.query

    //send query to services layer to return data to busniss layer
    const result  = await getAllMatchRole(searchQuery,true)

    //return res to front
    sendResponse(res, 200, "archived roles fetched successfully", result)

})

//get Role by id 
export const findRoleById = asyncHandler(async (req,res,next)=>{
    
    // destract id from req.params
    const id = req.params.id

    ///get role from services layer by dsend id from func
    const result = await getRoleById(id,false)
    //return res to front
    sendResponse(res, 200, "role fetched successfully", result)

})
//get archived Role by id 
export const findArchivedRoleById = asyncHandler(async (req,res,next)=>{
    
    // destract id from req.params
    const id = req.params.id

    ///get role from services layer by dsend id from func
    const result = await getRoleById(id,true)
    //return res to front
    sendResponse(res, 200, "archived role fetched successfully", result)

})

export const updateRole =  asyncHandler(async (req,res,next)=>{
        
     // destract id from req.params
    const id = req.params.id
    //destract data to update
    const updateData = req.body

    //send destracted data to services laye
    const result = await updateRoleFun(req,id,updateData)

    //return res to front
    sendResponse(res, 200, "role Update successfly", result)
})

///soft delete
export const softDeletedRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await softDeleteRoleWithPermissions(req, id);

  // 204 No Content on successful deletion
  return res.status(204).send();
});

