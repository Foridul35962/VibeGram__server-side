import ApiErrors from "../helpers/ApiErrors.js";
import ApiResponse from "../helpers/ApiResponse.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import Conversations from "../models/Conversations.model.js";
import Messages from "../models/Message.model.js";
import uploadToCloudinary from "../utils/uploadToCloundnary.js";

export const sendMessage = AsyncHandler(async (req, res) => {
    const sender = req.user._id
    const { receiver } = req.params

    if (!sender || !receiver) {
        throw new ApiErrors(400, 'sender and receiver are required')
    }

    const text = (req.body?.text ?? "").trim();
    const file = req.files?.[0]

    if (!text && !file) {
        throw new ApiErrors(400, "text or image is required");
    }

    let uploadedImage
    if (file) {
        if (!file.mimetype?.startsWith("image/")) {
            throw new ApiErrors(400, "only images are allowed");
        }

        const upload = await uploadToCloudinary(file.buffer, 'VibeGram')
        uploadedImage = {
            url: upload.secure_url,
            publicId: upload.public_id
        }
    }

    const message = await Messages.create({
        sender,
        receiver,
        text,
        ...(uploadedImage ? { image: uploadedImage } : {})
    })

    if (!message) {
        throw new ApiErrors(500, 'message save failed')
    }

    let conversation = await Conversations.findOne({
        participants: { $all: [sender, receiver] }
    })

    if (conversation) {
        conversation.messages.push(message._id)
        await conversation.save()
    } else {
        conversation = await Conversations.create({
            participants: [sender, receiver],
            messages: [message._id]
        })
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, message, 'message send successfully')
        )
})

export const getAllMessages = AsyncHandler(async (req, res) => {
    const sender = req.user._id
    const { receiver } = req.params

    if (!sender || !receiver) {
        throw new ApiErrors(400, 'sender and receiver are required')
    }

    const conversation = await Conversations.findOne({
        participants: { $all: [sender, receiver] }
    }).populate('messages')

    return res
        .status(200)
        .json(
            new ApiResponse(200, conversation.messages, 'all messages fetched successfully')
        )
})

export const getPrevUserChat = AsyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiErrors(401, "unauthorized");
    }

    const conversations = await Conversations.find({
        participants: userId,
    })
        .sort({ updatedAt: -1 })
        .populate("participants", "userName fullName image")
        .populate({
            path: "messages",
            options: { sort: { createdAt: -1 }, limit: 1 },
            select: "text image sender receiver createdAt",
        });

    const chats = conversations.map((c) => {
        const otherUser = c.participants.find(
            (p) => String(p._id) !== String(userId)
        );

        const lastMessage = c.messages?.[0] || null;

        return {
            conversationId: c._id,
            user: otherUser || null,
            lastMessage,
            updatedAt: c.updatedAt,
        };
    });

    return res
        .status(200)
        .json(new ApiResponse(200, chats, "previous chats fetched successfully"));
})
