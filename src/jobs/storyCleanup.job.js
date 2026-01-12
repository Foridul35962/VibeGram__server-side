import cron from "node-cron";
import Stories from "../models/Story.model.js";
import cloudinary from "../config/cloudinary.js";

const startStoryCleanupJob = () => {
    let isRunning = false;

    cron.schedule("*/5 * * * *", async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const expiredStories = await Stories
                .find({ createdAt: { $lte: expiryTime } })
                .sort({ createdAt: 1 })
                .limit(30);

            for (const story of expiredStories) {
                try {
                    if (story.media?.publicId) {
                        await cloudinary.uploader.destroy(story.media.publicId, {
                            resource_type: story.mediaTypes === "video" ? "video" : "image",
                        });
                    }

                    await story.deleteOne();
                } catch (err) {
                    console.error("Story cleanup failed:", story._id, err?.message);
                }
            }
        } finally {
            isRunning = false;
        }
    });
};

export default startStoryCleanupJob;