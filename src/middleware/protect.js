import jwt from 'jsonwebtoken'
import ApiErrors from "../helpers/ApiErrors.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import Users from '../models/Users.model.js';

const protect = AsyncHandler(async(req, res, next)=>{
    const token = req.cookies?.token
    if (!token) {
        throw new ApiErrors(404, 'token is not found')
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
        
        const user = await Users.findById(decoded.userId).select("-password")
        if (!user) {
            throw new ApiErrors(404, 'user is not found')
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiErrors(401, 'token failed, unauthorize access')
    }
})

export default protect