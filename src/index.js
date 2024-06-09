import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
});

connectDB();



// FIRST APPROACH


// import express from "express"

// const app = express();

// ;(async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error", (error)=>{
//             console.log("APP FAILED TO COMMUNICATE WITH THE DATABASE: ");
//             throw error;
//         });
//     }
//     catch(error){
//         console.log("Failed to connect or establish server");
//         throw error;
//     }
// })()