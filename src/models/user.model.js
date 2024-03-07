import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import mongoose from "mongoose"


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    fullname: {
        type : String,
        required: [true,"FullName Is Required!!"],
        unique: true,
        trim: true,
        index: true,
        min: 5,
        max: 50
    },
    email: {
        type: String,
        required: [true,"Email Is Required!!"],
        unique: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: [true,"Password Is Required!!"],
        unique: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        required: true,
    },
    coverimage: {
        type: String
    },
    refreshToken: {
        type: String,
    },
    role: {
        type: String,
        required: true,
        enum: ["admin","user","mod"],
        default: "user"
    }
},{
    timestamps: true,
  }
)
//Password Encryption

userSchema.pre("save", async function(next){
    if(!this.isModified("password"))next(); //if password is modified then only brcypt it 
    //encrypt it 
    this.password = await bcrypt.hash(this.password,12);
    next()
})

//check for same password 
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

//tokens 

userSchema.methods.generateAccessToken = function(){
    return jwt.sign( //for token generation
        { //these are all payload
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign( //for token generation
    { //these are all payload
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User",userSchema) 