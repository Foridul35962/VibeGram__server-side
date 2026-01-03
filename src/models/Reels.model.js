import mongoose from "mongoose";

const reelSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    media: {
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String
        }
    },
    caption: {
        type: String
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }],
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
        },
        message: {
            type: String
        }
    }]
}, { timestamps: true })

const Reels = mongoose.model('Reels', reelSchema)

export default Reels