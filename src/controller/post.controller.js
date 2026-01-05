import cloudinary from "../config/cloudinary.js";
import ApiErrors from "../helpers/ApiErrors.js";
import ApiResponse from "../helpers/ApiResponse.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import Posts from "../models/Posts.model.js";
import uploadToCloudinary from "../utils/uploadToCloundnary.js";

export const uploadPost = AsyncHandler(async (req, res) => {
    const userId = req.user._id
    let { caption } = req.body

    const files = req.files

    if (!files || files.length === 0) {
        throw new ApiErrors(400, 'file is required')
    }

    const uploadImg = []
    const publicIds = []

    try {
        for (const file of files) {
            const upload = await uploadToCloudinary(file.buffer, 'VibeGram')
            uploadImg.push({
                url: upload.secure_url,
                publicId: upload.public_id,
            })
            publicIds.push(upload.public_id)
        }
    } catch (error) {
        for (const id of publicIds) {
            await cloudinary.uploader.destroy(id)
        }
        throw new ApiErrors(500, 'post upload failed')
    }

    if (!uploadImg || uploadImg.length === 0) {
        throw new ApiErrors(500, 'post upload failed')
    }

    caption = caption.trim()

    const post = await Posts.create({
        author: userId,
        media: uploadImg,
        caption
    })

    if (!post) {
        throw new ApiErrors(500, 'post save failed')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, post, 'upload post successfully')
        )
})

export const deletePost = AsyncHandler(async (req, res) => {
    const { postId } = req.body
    const user = req.user

    if (!postId) {
        throw new ApiErrors(400, 'post id is required')
    }

    const post = await Posts.findOne({
        _id: postId,
        author: user._id
    })

    if (!post) {
        throw new ApiErrors(404, 'post not found')
    }

    try {
        for (const file of post.media) {
            if (file.publicId) {
                await cloudinary.uploader.destroy(file.publicId)
            }
        }
    } catch (error) {
        throw new ApiErrors(500, 'post delete failed')
    }

    await post.deleteOne()

    return res
        .status(200)
        .json(
            new ApiResponse(200, postId, 'post delete successfully')
        )
})

export const getPost = AsyncHandler(async (req, res) => {
    const { postId } = req.params

    if (!postId) {
        throw new ApiErrors(400, 'post id is required')
    }

    const post = await Posts.findById(postId).populate('author', 'userName image fullName')
    if (!post) {
        throw new ApiErrors(404, 'post is not found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, post, 'post fetched successfully')
        )
})

export const getUserAllPosts = AsyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new ApiErrors(400, 'user id is required')
    }

    const posts = await Posts.find({
        author: userId
    }).sort({ createdAt: -1 })

    return res
        .status(200)
        .json(
            new ApiResponse(200, posts, 'posts fetched successfully')
        )
})

export const savedUnsavedPosts = AsyncHandler(async (req, res) => {
    const { postId } = req.body
    const user = req.user

    if (!postId) {
        throw new ApiErrors(400, 'post id is required')
    }

    const post = await Posts.findById(postId)
    if (!post) {
        throw new ApiErrors(404, 'post not found')
    }

    const isSaved = user.savedPosts.some(id => id.toString() === postId.toString())

    if (isSaved) {
        user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId.toString())
    } else {
        user.savedPosts.push(postId)
    }

    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, postId, 'post saved successfully')
        )
})

export const likedUnlikedPost = AsyncHandler(async (req, res) => {
    const { postId } = req.body
    const userId = req.user._id

    if (!postId) {
        throw new ApiErrors(400, 'post id is required')
    }

    const post = await Posts.findById(postId)

    if (!post) {
        throw new ApiErrors(404, 'post not found')
    }

    const isLiked = post.likes.some(id => id.toString() === userId.toString())

    if (isLiked) {
        post.likes = post.likes.filter(id => id.toString() !== userId.toString())
    } else {
        post.likes.push(userId)
    }


    await post.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, postId, 'post liked or unliked successfully')
        )
})

export const commentPost = AsyncHandler(async (req, res) => {
    const { postId, message } = req.body
    const userId = req.user._id

    if (!postId) {
        throw new ApiErrors(400, 'post id is required')
    }

    if (!message || !message.trim()) {
        throw new ApiErrors(400, 'message is required')
    }

    const post = await Posts.findById(postId)
    if (!post) {
        throw new ApiErrors(404, 'post not found')
    }

    const trimMsg = message.trim()

    post.comments.push({
        author: userId,
        message: trimMsg
    })

    await post.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, postId, 'comment successful')
        )
})