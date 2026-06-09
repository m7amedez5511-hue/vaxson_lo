import { Router } from "express";
import * as UC from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validstors.js";
import { isAuthorized } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/permission.middleware.js";

const router = Router();

router.use(isAuthorized)

//create user
router.post("/",restrictTo("create-user"), validate(createUserSchema), UC.createUser);


//get all users router
router.get("/", restrictTo("read-user"),UC.getUsers);
//get Archived Users
router.get("/archived", restrictTo("read-deleted-user"),UC.fetchArchivedUsers)
//get Archived User by user id
router.get("/archived/:id", restrictTo("read-deleted-user"),UC.getArchivedUserById)
//get user info (must be before /:id)
router.get("/me",restrictTo("read-user-info"), UC.userInfo);
//get user by user id
router.get("/:id",restrictTo("read-user"), UC.getUserById);
//update router
router.put("/:id",restrictTo("update-user"), validate(updateUserSchema), UC.updateUser);
    //delete router
router.delete("/:id",restrictTo("delete-user"), UC.softDeleteUser);

export default router;
