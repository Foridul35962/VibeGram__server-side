import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import ApiErrors from "../helpers/ApiErrors.js";
import ApiResponse from "../helpers/ApiResponse.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import Reels from "../models/Reels.model.js";
import uploadToCloudinary from "../utils/uploadToCloundnary.js";

export const uploadReel = AsyncHandler(async (req, res) => {
    const userId = req.user._id
    let { caption } = req.body

    const files = req.files?.[0]

    if (!files) {
        throw new ApiErrors(400, 'file is required')
    }

    if (!files.mimetype.startsWith("video/")) {
        throw new ApiErrors(400, "only video is allowed")
    }


    let uploadReel
    try {
        const upload = await uploadToCloudinary(files.buffer, 'VibeGram')
        uploadReel = {
            url: upload.secure_url,
            publicId: upload.public_id,
        }
    } catch (error) {
        throw new ApiErrors(500, 'reel upload failed')
    }

    if (!uploadReel) {
        throw new ApiErrors(500, 'reel upload failed')
    }

    caption = (caption || "").trim()

    const reel = await Reels.create({
        author: userId,
        media: uploadReel,
        caption
    })

    if (!reel) {
        throw new ApiErrors(500, 'reel save failed')
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, reel, 'upload reel successfully')
        )
})

export const deleteReel = AsyncHandler(async (req, res) => {
    const { reelId } = req.body
    const user = req.user

    if (!reelId) {
        throw new ApiErrors(400, 'reel id is required')
    }

    const reel = await Reels.findOne({
        _id: reelId,
        author: user._id
    })

    if (!reel) {
        throw new ApiErrors(404, 'reel not found')
    }

    try {
        if (reel.media.publicId) {
            await cloudinary.uploader.destroy(reel.media.publicId, { resource_type: "video" })
        }
        await reel.deleteOne()
    } catch (error) {
        throw new ApiErrors(500, 'reel delete failed')
    }


    return res
        .status(200)
        .json(
            new ApiResponse(200, reelId, 'reel delete successfully')
        )
})

export const getReel = AsyncHandler(async (req, res) => {
    const { reelId } = req.params

    if (!reelId) {
        throw new ApiErrors(400, 'reel id is required')
    }

    if (!mongoose.Types.ObjectId.isValid(reelId)) {
        throw new ApiErrors(400, "invalid reel id");
    }

    const reel = await Reels.findById(reelId)
        .populate('author', 'userName image fullName')
        .populate('comments.author', 'userName image')

    if (!reel) {
        throw new ApiErrors(404, 'reel is not found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, reel, 'reel fetched successfully')
        )
})

export const getAllReels = AsyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "5", 10), 1), 50);
    const skip = (page - 1) * limit;

    const [reels, total] = await Promise.all([
        Reels.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "fullName userName image")
            .populate('comments.author', 'userName image'),
        Reels.countDocuments({})
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, { reels, page, limit, total }, "all reels fetched successfully")
        );
})

export const getUserAllReels = AsyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new ApiErrors(400, 'user id is required')
    }

    const reels = await Reels.find({
        author: userId
    }).sort({ createdAt: -1 })

    return res
        .status(200)
        .json(
            new ApiResponse(200, reels, 'reels fetched successfully')
        )
})

export const likedUnlikedReel = AsyncHandler(async (req, res) => {
    const { reelId } = req.body
    const userId = req.user._id

    if (!reelId) {
        throw new ApiErrors(400, 'reel id is required')
    }

    const reel = await Reels.findById(reelId)

    if (!reel) {
        throw new ApiErrors(404, 'reel not found')
    }

    const isLiked = reel.likes.some(id => id.toString() === userId.toString())

    if (isLiked) {
        reel.likes = reel.likes.filter(id => id.toString() !== userId.toString())
    } else {
        reel.likes.push(userId)
    }

    await reel.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, reelId, 'reel liked or unliked successfully')
        )
})

export const commentReel = AsyncHandler(async (req, res) => {
    const { reelId, message } = req.body
    const userId = req.user._id

    if (!reelId) {
        throw new ApiErrors(400, 'reel id is required')
    }

    if (!message || !message.trim()) {
        throw new ApiErrors(400, 'message is required')
    }

    const reel = await Reels.findById(reelId)
    if (!reel) {
        throw new ApiErrors(404, 'reel not found')
    }

    const trimMsg = message.trim()

    reel.comments.push({
        author: userId,
        message: trimMsg
    })

    await reel.save()

    await reel.populate({
        path: 'comments',
        populate: {
            path: 'author',
            select: 'userName image'
        }
    })

    const comment = reel.comments.at(-1)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { reelId, comment }, 'comment successful')
        )
})