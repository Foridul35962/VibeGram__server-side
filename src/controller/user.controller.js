import ApiResponse from "../helpers/ApiResponse.js";
import AsyncHandler from "../helpers/AsyncHandler.js";

export const getUser = AsyncHandler(async(req, res)=>{
    const user = req.user
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'user data fetched successfully')
        )
})