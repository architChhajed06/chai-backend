import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";



export const verifyJWT = asyncHandler( async (req, res, next) => {
try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ",""); //replace "Bearer <access token>" with just "<access token>"
        console.log("TOKEN: ", token);
        console.log("req: ", req.body);
        if(!token){
            throw new ApiError(401, "Unauthorized request 111");
        }
    
    
        const decodedTokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    
        const user = await User.findById(decodedTokenInfo?._id).select("-password -refreshToken");
    
    
    
        if(!user){
            // NEXT_VIDEO: discuss about frontend
            throw new ApiError(401, "Invalid Access Token");
        }
    
    
    
        // If user is verified, then we add something to the request object
        req.user = user;
        next();
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
    
}
})