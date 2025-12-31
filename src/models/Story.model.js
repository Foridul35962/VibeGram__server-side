import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    mediaTypes: {
        type: String,
        required: true,
        enum: ['image', 'video']
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
    viewers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400
    }
}, {timestamps: true})

const Stories = mongoose.model('Stories', storySchema)

export default Stories