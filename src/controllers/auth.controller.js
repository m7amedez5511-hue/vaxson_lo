import { asyncHandler } from "../middleware/errorHandler.js";
import { loginFun } from "../services/auth.service.js";
import { signJwt } from "../utils/jwt.utils.js";
import { sendResponse } from "../utils/response.js";


/**
 * login
 * @param send (username or emaii ,password)
 * @return object {token{accessToken ,refreshtoken } ,userdata }
 */


export const login = asyncHandler( async (req,res,next)=>{

console.log("user is her ");

//get data from body 
const userData = req.body
   
    
//create user by using fun from services layer
const result = await loginFun(req,userData)

//create token and refreshToken 
const token = await signJwt(
    result.id,
    'ACCESS_TOKEN_SECRET',
    "user",
  );
  
//send otp to confirm user check email is real email

//send respons
sendResponse(
    res,
    201,
    'user login successfuly',
    {
      user :result,
      token,
      
    }
  );


})
