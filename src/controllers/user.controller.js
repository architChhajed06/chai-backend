import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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
    const existedUser = User.findOne({
        $or: [ {username}, {email}]
    });
    if(existedUser){
        throw new ApiError(409, "User with this username or email already exists");
    }

    // 4
    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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


export default registerUser;