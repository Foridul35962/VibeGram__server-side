import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    text: {
        type: String
    },
    image: {
        url: {
            type: String
        },
        publicId: {
            type: String
        }
    }
}, {timestamps: true})

const Messages = mongoose.model('Messages', messageSchema)

export default Messages