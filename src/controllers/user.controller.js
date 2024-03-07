import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler( async(req,res) => {
    const { fullname,email,username,password,role } = req.body

    if(
        [fullname, email, password, username].some((field) => 
            field?.trim() === "")
    ){
        throw new ApiError(400, "All Fields are required");
    }

    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(400,"User Already Existed,Change your Username or email");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar Is Required!")
    }

    //Upload them to Cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if(!avatar){
        throw new ApiError(400,"Avatar Is Required!")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
        role
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userCreated){
        throw new ApiError(500, "Something Went Wrong while creating User")
    }

    return res.status(201).json(
        new ApiResponse(200,res.json,userCreated,"User Created SuccessFully!!")
    )

})

const loginUser = asyncHandler( async (req,res) => {

    const {email,password,username,avatar} = req.body

    if (!(username || email || password)) {
        throw new ApiError(400,"username or email is required!!")
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"User does not exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Password!")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //Cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            res.json,
            "User Logged In Successfully!!"
        )
    )

})

const logoutUser = asyncHandler( async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new : true
        }
    )

    //Cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,"User Logged Out!")
    )

})

const getCurrentUser = asyncHandler( async (req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200,req.user,"Current User Fetched Successfully!")
    )
})

const getAllUsers = asyncHandler( async (req,res)=>{
    try {
        const allUsers = await User.find({}).select("-password");
        if (!allUsers) {
          throw new ApiError(404, "Users not found");
        }
        return res.status(200)
        .json(
            new ApiResponse(200, allUsers, "All Users fetched Successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Failed to fetch all Users");
    }
})

const deleteUser = asyncHandler( async(req,res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        return res.status(200)
        .json(new ApiResponse(200,"User Deleted Successfully!"))
    } catch (error) {
        throw new ApiError(403, "Unauthorized Action!")
    }
})

const updateUser = asyncHandler( async(req,res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        await User.findByIdAndUpdate(
            userId,
            updateData,
            { 
                new: true 
            }
        );

        return res.status(200)
        .json(new ApiResponse(200,"User Updated Successfully!"))
    } catch (error) {
        throw new ApiError(403, "Unauthorized Action!")
    }
})

const getDashboard = asyncHandler( async (req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200,"Dashboard Fetched Successfully!")
    )
})

const getSetting = asyncHandler( async (req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200,req.user,"Setting Fetched Successfully!")
    )
})

const getStatistics = asyncHandler( async (req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200,req.user,"Stats Fetched Successfully!")
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    getAllUsers,
    getCurrentUser,
    updateUser,
    deleteUser,
    getDashboard,
    getSetting,
    getStatistics
};
