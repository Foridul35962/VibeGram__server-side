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