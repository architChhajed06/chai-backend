import {v2 as cloudinary} from "cloudinary";
import fs from "fs"; //fs module

    // Configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
    });


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath){
            //no local file path was provided
            console.log("No local file path provided...aborting upload");
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("File succesfully uploaded: ", response.url);
        return response;
    }
    catch(error){
        console.log("Failed to upload the file, unlinking the local file path");
        fs.unlinkSync(localFilePath);
        //remove the locally saved temporary file as the upload operation got failed
        return null;
    }

};



export {uploadOnCloudinary};