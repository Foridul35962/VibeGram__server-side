import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
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
    caption: {
        type: String
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }]
}, { timestamps: true })

const Posts = mongoose.model('Posts', postSchema)

export default Posts