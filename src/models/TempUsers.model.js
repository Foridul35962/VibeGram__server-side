import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    otp:{
        type: String,
        required: true
    },
    expiredOtp:{
        type: Date
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: 600
    }
})

const TempUsers = mongoose.model('TempUsers', tempUserSchema)

export default TempUsers