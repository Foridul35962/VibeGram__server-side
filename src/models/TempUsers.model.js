import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    userName: {
        type: String,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    otp: {
        type: String,
        required: true
    },
    expiredOtp: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
})

const TempUsers = mongoose.model('TempUsers', tempUserSchema)

export default TempUsers