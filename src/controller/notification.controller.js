import ApiErrors from "../helpers/ApiErrors.js";
import ApiResponse from "../helpers/ApiResponse.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import Notifications from "../models/Notification.model.js";

export const getAllNotification = AsyncHandler(async (req, res) => {
    const userId = req.user._id

    const notifications = await Notifications
        .find({ receiver: userId })
        .populate('sender', 'userName image')

    return res
        .status(200)
        .json(
            new ApiResponse(200, notifications, 'notification fetched completed')
        )
})

export const markAsRead = AsyncHandler(async(req, res)=>{
    const {notificationId} = req.body
    const userId = req.user._id

    if (!notificationId) {
        throw new ApiErrors(400, 'notification id is required')
    }

    try {
        if (Array.isArray(notificationId)) {
            await Notifications.updateMany(
                {_id: {$in: notificationId}, receiver: userId},
                {$set:{isRead: true}}
            )
        } else {
            await Notifications.findOneAndUpdate(
                {
                    _id: notificationId,
                    receiver: userId
                },
                {
                    isRead: true
                }
            )
        }
    } catch (error) {
        throw new ApiErrors(500, error.message)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'notification mark as read successfully')
        )
})