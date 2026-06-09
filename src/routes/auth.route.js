import { Router } from "express";
import { validate } from "../middleware/validate.js";
import * as AC from "../controllers/auth.controller.js"
import { loginSchema } from "../validators/auth.validators.js";


const router = Router()




//login user
router.post("/login", validate(loginSchema), AC.login);





export default router