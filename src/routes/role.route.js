import { Router } from "express";
import * as RC from "../controllers/role.controller.js";
import { validate } from "../middleware/validate.js";
import { roleCreateValidator, roleUpdateValidator } from "../validators/role.validator.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/permission.middleware.js";
import { assignPermissionValidator } from "../validators/rolePremisson.validators.js";





//BC == Role controller


const router = Router()

router.use(isAuthorized)

/**
 * create new role
 * @param method post
 * @param example router.post('/', newRole)
 * @param result {id : 123,name : "head mang",des , "mange jop",createat :"12:50"}
 * @param handel role premission middleware
 * // Single permission

   
   
 */


router.post("/" ,restrictTo("create-role"),validate(roleCreateValidator),RC.createRole)


//get all role by query
router.get("/",restrictTo("read-role"),RC.allRoles)

//get role using roleId
router.get("/:id" ,restrictTo("read-role"), RC.findRoleById)

//update role by roleId
router.put("/:id",restrictTo("update-role"),validate(roleUpdateValidator),RC.updateRole)

// Role-based 
   router.delete('/:id',restrictTo("delete-role"), RC.softDeletedRole);
//archived ـــــــــــــــــــــــ
//get all archived role 
router.get("/archived",restrictTo("read-deleted-role"),RC.fetchArchivedRoles)
//get archived role using roleId
router.get("/archived/:id" ,restrictTo("read-deleted-role"), RC.findArchivedRoleById)
// Assign permission to role
router.post("/:id/permissions", restrictTo("manage-role-permissions"), validate(assignPermissionValidator), RC.assignPermissionToRole);

// Remove permission from role
router.delete("/:id/permissions/:permissionId", restrictTo("manage-role-permissions"), RC.removePermissionFromRole);
export default router