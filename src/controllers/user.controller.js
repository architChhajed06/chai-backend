import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { trusted } from "mongoose";
const generateAccessAndRefreshToken = async (userId) =>{
    try{
        const user = await User.findById(userId);
        console.log("FOUND USER BY ID")
        const accessToken = await user.generateAccessToken();
        console.log("GENERATED ACCESS TOKEN: ",accessToken);
        const refreshToken = await user.generateRefreshToken();
        console.log("GENERATED REFRESH TOKEN: ", refreshToken);


        user.refreshToken = refreshToken;
        console.log("SET");

        await user.save({validateBeforeSave: false});
        console.log("POSTED")
        return {accessToken, refreshToken};
    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // Step 1: get user details from frontend
    // Step 2: validation (check if user has sent all the required fieldscls) (if frontend has missed some validation then it can be checked here)
    // Step 3: Check if user already exists: username, email
    // Step 4: Check for images, check for avatar (avatar is compulsory)
    // Step 5: Upload them to cloudinary, check if avatar has been succesfully uploaded
    // Step 6: Create user object - create an entry in db
    // Step 7: Remove password and refresh token from response
    // Step 8: Check if user was succesfully created in the db (Check for user creation)
    // Step 9: Return response


    // 1
    const {fullName, username, email, password} = req.body;
    console.log(fullName, username, email, password);
    // 2
    if (
        [fullName, username, email, password].some( (field) => {
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required");
    }


    //3
    const existedUser = await User.findOne({
        $or: [ {username}, {email}]
    });
    if(existedUser){
        throw new ApiError(409, "User with this username or email already exists");
    }

    // 4
    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0].path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.file.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }



    return res.status(201).json(new ApiResponse(200, createdUser, "User Created Successfully"))
});



const loginUser = asyncHandler( async (req, res) => {
    // 1 fetch details from frontend
    // 2 verify if user exists
    // 2.1 if does not exist return error
    // 3 if user exists then verify the password
    // 4 if password correct then login() and provide with access_token and refresh token
    // 5 if not password correct, return error


    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh toekn


    const {email, username, password} = req.body;
    console.log("req : ", req.body);
    console.log("Username: ", username);
    console.log("email: ", email);
    console.log("password: ", password);
    if(!username && !email){
        throw new ApiError(400, "Username or password is required");
    };


    const user = await User.findOne({
        $or: [{ username }, { email }]
    });


    if(!user){
        throw new ApiError("404", "User Does Not Exist");
    };



    // Don't use User instead of user, User is a mongoDB object and will not have your custom made methods

    const isPasswordValid  = await user.isPasswordCorrect(password);


    if(!isPasswordValid){
        throw new ApiError(401, "Password Incorrect");
    }


    // If user entered password is correct then generate access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    // Optional Step
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Send cookies 
    // setting cookie options
    const options = {
        httpOnly: true,
        secure: true //so that cookies cannot be modified on frontend, and can only be modified on the backend
    }


    return res
    .status(200)
    .cookie("accessToken", accessToken, options) //using cookie parser middleware
    .cookie("refreshToken", refreshToken)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged In Succesfully"
        )
    );

})


const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );


    const options = {
        httpOnly: true,
        secure: true //so that cookies cannot be modified on frontend, and can only be modified on the backend
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User"));
})


const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;


    if(!incomingRefreshToken){
        throw new ApiError(401, "Incoming Refresh Token does not exist");
    }

try {
        const decodedInfo = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedInfo._id);
    
        if(!user){
            throw new ApiError(402, "The incoming refresh token does not correspond to any user present in the database");
        }
    
    
        // now checking if the user that the incoming refresh token corresponds, actually has that refresh token equal to the incoming refresh token or not, if not, then that means that the refresh token that user has sent (incomingRefreshToken) has expired, that is it the expired token can still be decoded and user._id can be extracted from the expired token but since it is expired it might not match the token in the database
    
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(403, "User's refresh token is used or expired");
        }
    
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
    
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(
            new ApiResponse(200, {
                accessToken,
                refreshToken: newRefreshToken
            },
            "Access Token Refreshed")
        );
} catch (error) {
    throw new ApiError(401, error?.msg || "Invalid Refresh Token");
}
}) 


export { registerUser, loginUser, logoutUser, refreshAccessToken };