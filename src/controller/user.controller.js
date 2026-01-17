import { populate } from "dotenv";
import cloudinary from "../config/cloudinary.js";
import ApiErrors from "../helpers/ApiErrors.js";
import ApiResponse from "../helpers/ApiResponse.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import Users from "../models/Users.model.js";
import uploadToCloudinary from "../utils/uploadToCloundnary.js";

export const getUser = AsyncHandler(async (req, res) => {
    const user = req.user
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'user data fetched successfully')
        )
})

export const suggestedUser = AsyncHandler(async (req, res) => {
    const user = req.user;

    const suggestedUser = await Users.aggregate([
        {
            $match: {
                _id: {
                    $nin: [user._id, ...user.followings],
                },
            },
        },
        { $sample: { size: 4 } },
        {
            $project: {
                _id: 1,
                image: 1,
                userName: 1,
                fullName: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, suggestedUser, "suggestedUser fetched successfully"));
});

export const followUnfollow = AsyncHandler(async (req, res) => {
    const user = req.user
    const { followingUserId } = req.body

    if (!followingUserId) {
        throw new ApiErrors(400, 'following user Id is required')
    }

    if (user._id.toString() === followingUserId.toString()) {
        throw new ApiErrors(400, "user can't follow himself")
    }

    const followingUser = await Users.findById(followingUserId)
    if (!followingUser) {
        throw new ApiErrors(404, 'following user not found')
    }

    const isFollowing = user.followings.some(id => id.toString() === followingUserId.toString())

    if (isFollowing) {
        user.followings = user.followings.filter((id) => id.toString() !== followingUserId.toString())
    } else {
        user.followings.push(followingUserId)
    }

    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, followingUserId, isFollowing ? 'unfollow' : 'follow')
        )
})

export const updateUserProfile = AsyncHandler(async (req, res) => {
    const user = req.user
    const { fullName, bio, profession, gender } = req.body

    const image = req.files?.[0]
    let uploadImage
    if (image) {
        try {
            const upload = await uploadToCloudinary(image.buffer, 'VibeGram')
            uploadImage = {
                url: upload.secure_url,
                publicId: upload.public_id
            }
            if (user.image.publicId) {
                await cloudinary.uploader.destroy(user.image.publicId)
            }
        } catch (error) {
            throw new ApiErrors(500, 'image upload failed')
        }
    }
    if (uploadImage) {
        user.image = uploadImage
    }
    if (fullName) {
        user.fullName = fullName
    }
    if (bio) {
        if (bio.length > 150) {
            throw new ApiErrors(400, 'bio is out of the length')
        }
        user.bio = bio
    }
    if (profession) {
        user.profession = profession
    }
    if (gender) {
        if (gender !== 'male' && gender !== 'female') {
            throw new ApiErrors(400, 'gender input wrong value')
        }
        user.gender = gender
    }
    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'user update successfully')
        )
})

export const findUser = AsyncHandler(async (req, res) => {
    const { userName } = req.params
    const owner = req.user

    if (!userName) {
        throw new ApiErrors(400, 'userName is required')
    }

    let query = await Users.findOne({ userName })
        .select('-password')
        .populate('followings', "image fullName userName _id")

    if (owner.userName === userName) {
        query = query.populate({
            path: 'savedPosts',
            populate: {
                path: 'author',
                select: 'userName image'
            }
        })
    }

    const user = await query

    if (!user) {
        throw new ApiErrors(404, 'user not found')
    }
    const followers = await Users.find({ followings: user._id })
        .select('userName image _id')

    user.followers = followers

    const userObj = user.toObject();
    userObj.followers = followers;

    return res
        .status(200)
        .json(
            new ApiResponse(200, userObj, 'user fetched successfully')
        )
})

export const searchUser = AsyncHandler(async (req, res) => {
    const { user } = req.query
    const userId = req.user._id

    if (!user) {
        throw new ApiErrors(400, 'search element is required')
    }

    const users = await Users.find({
        _id: { $ne: userId },
        $or: [
            { userName: { $regex: user, $options: "i" } },
            { fullName: { $regex: user, $options: "i" } }
        ]
    }).select('userName fullName image _id')

    return res
        .status(200)
        .json(
            new ApiResponse(200, users, 'user fectched successfully')
        )
})