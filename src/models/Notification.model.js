import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    receiver:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    type:{
        type: String,
        enum: ['like', 'comment', 'follow'],
        required: true
    },
    message:{
        type: String,
        required: true
    },
    posts:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Posts"
    },
    reels:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reels"
    },
    isRead:{
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const Notifications = mongoose.model('Notifications', notificationSchema)

export default Notifications