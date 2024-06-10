import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();


//1 CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));


//2 To parse JSON data
app.use(express.json({
    limit: "16kb"
}));

//3 To read url data
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

//4 To serve some public static assets
app.use(express.static("public"));


export { app };
