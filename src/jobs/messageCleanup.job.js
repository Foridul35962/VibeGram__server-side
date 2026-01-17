import cron from 'node-cron'
import Messages from '../models/Message.model.js'
import cloudinary from '../config/cloudinary.js'
import Conversations from '../models/Conversations.model.js'

const startMessageCleanupJob = () => {
    let isRunning = false

    cron.schedule('*/10 * * * *', async () => {
        if (isRunning) {
            return
        }
        isRunning = true

        try {
            const expiryTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

            const expiredMessage = await Messages
                .find({ createdAt: { $lte: expiryTime } })
                .sort({ createdAt: 1 })
                .limit(30)

            for (const message of expiredMessage) {
                try {
                    if (message.image.publicId) {
                        await cloudinary.uploader.destroy(message.image.publicId)
                    }

                    await Conversations.updateMany(
                        { messages: message._id },
                        { $pull: { messages: message._id } }
                    )

                    await message.deleteOne()
                } catch (error) {
                    console.error('message cleanup failed', message._id, error)
                }
            }

            await Conversations.deleteMany({
                messages: { $size: 0 }
            })
        } finally {
            isRunning = false
        }
    })
}

export default startMessageCleanupJob