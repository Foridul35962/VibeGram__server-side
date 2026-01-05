import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import ApiErrors from "../helpers/ApiErrors.js";
import ApiResponse from "../helpers/ApiResponse.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import Stories from "../models/Story.model.js";
import uploadToCloudinary from "../utils/uploadToCloundnary.js";

export const uploadStory = AsyncHandler(async (req, res) => {
    const user = req.user
    const files = req.files?.[0]

    if (!files) {
        throw new ApiErrors(400, 'file is missing')
    }

    const mediaTypes = files.mimetype.startsWith("video/") ? "video" : "image";

    let upload
    try {
        upload = await uploadToCloudinary(files.buffer, 'VibeGram')
    } catch (error) {
        throw new ApiErrors(500, 'story upload failed')
    }

    const story = await Stories.create({
        author: user._id,
        mediaTypes,
        media: {
            url: upload.secure_url,
            publicId: upload.public_id
        },
    })

    if (!story) {
        throw new ApiErrors(500, 'story saved failed')
    }

    user.stories.push(story._id)
    await user.save()

    return res
        .status(201)
        .json(
            new ApiResponse(201, story, 'story upload successfully')
        )
})

export const deleteStory = AsyncHandler(async (req, res) => {
    const { storyId } = req.body
    const user = req.user

    if (!storyId) {
        throw new ApiErrors(400, 'story id is required')
    }

    const story = await Stories.findOne({
        _id: storyId,
        author: user._id
    })

    if (!story) {
        throw new ApiErrors(404, 'story not found')
    }

    try {
        if (story.media.publicId) {
            await cloudinary.uploader.destroy(story.media.publicId, {
                resource_type: story.mediaTypes === "video" ? "video" : "image",
            })
        }

        user.stories = user.stories.filter((id) => id.toString() !== storyId)
        await user.save()
    } catch (error) {
        throw new ApiErrors(500, 'story remove failed')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, storyId, 'story removed successfully')
        )
})

export const viewStory = AsyncHandler(async (req, res) => {
    const { storyId } = req.body
    const userId = req.user._id

    if (!storyId) {
        throw new ApiErrors(400, 'story id is required')
    }

    if (!mongoose.isValidObjectId(storyId)) {
        throw new ApiErrors(400, "invalid story id")
    };

    const updatedStory = await Stories.findByIdAndUpdate(
        storyId,
        { $addToSet: { viewers: userId } },
        { new: true }
    )

    if (!updatedStory) {
        throw new ApiErrors(404, 'story not found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { storyId, viewer: userId }, 'story view update successfully')
        )
})