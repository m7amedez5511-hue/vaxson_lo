
import { Router } from "express";
import * as PC from "../controllers/premission.controller.js";
import { restrictTo } from "../middleware/permission.middleware.js";


//BC == Role controller


const router = Router()


//get all premission
router.get("/",restrictTo("read-permission"),PC.getAllPremission)




export default router