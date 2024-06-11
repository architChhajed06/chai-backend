import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unqiue: true,
        lowercase: true,
        trim: true,
        index: true, //This is important for making username easier to search and retrieve
    },
    email: {
        type: String,
        required: true,
        unqiue: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true, //This is important for making username easier to search and retrieve
    },
    avatar: {
        type: String, //cloudinary url
        required: true,
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password field is required"]
    },
    refreshToken: {
        type: String
    }
},{timestamps:true});


//middle ware to do something just before everytime the data is saved

userSchema.pre("save", async function (next) {
    if(this.isModified("password")){ //if only password is modified then reencrpt or enterred for the sma time
        this.password = bcrypt.hash(this.password, 10);
        next();
    }
    return next();
});



//custom method isPasswordCorrect added to userSchema
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

// 
userSchema.methods.generateAccessToken = async function()
{
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    );
}

export const User = mongoose.model("User", userSchema);
