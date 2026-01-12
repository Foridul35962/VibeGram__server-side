import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }],
    messages:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Messages"
    }]
}, {timestamps: true})

const Conversations = mongoose.model('Conversations', conversationSchema)

export default Conversations