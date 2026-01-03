import ApiErrors from "../helpers/ApiErrors.js";
import ApiResponse from "../helpers/ApiResponse.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import Users from "../models/Users.model.js";

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

export const followUnfollow = AsyncHandler(async(req, res)=>{
    const user = req.user
    const {followingUserId} = req.body

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
        user.followings = user.followings.filter((id)=>id.toString() !== followingUserId.toString())
    } else{
        user.followings.push(followingUserId)
    }

    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, followingUserId, isFollowing?'unfollow' : 'follow')
        )
})