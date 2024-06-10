import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
});

connectDB()
.then( ()=> {
    console.log("SUCCESFULLY CONNECTED TO Mongo DB");
    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running at port ${process.env.PORT}`);
    });
})
.catch( (error) => {
    console.log("MONGODB connection failed !!! ");
});



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