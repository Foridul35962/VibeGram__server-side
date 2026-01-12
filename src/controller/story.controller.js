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
    await story.populate('author', 'fullName userName image _id')

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
        await story.deleteOne()
    } catch (error) {
        console.log(error)
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

export const allFollowingUserStory = AsyncHandler(async (req, res) => {
  const user = req.user
  const followings = user.followings || []

  // followings stories: viewers বাদ
  const followingsPipeline = (authorMatch) => ([
    { $match: { author: authorMatch } },
    { $sort: { createdAt: -1 } },

    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author"
      }
    },
    { $unwind: "$author" },

    {
      $group: {
        _id: "$author._id",
        author: {
          $first: {
            _id: "$author._id",
            userName: "$author.userName",
            fullName: "$author.fullName",
            image: "$author.image"
          }
        },
        stories: {
          $push: {
            _id: "$_id",
            media: "$media",
            mediaTypes: "$mediaTypes",
            createdAt: "$createdAt"
            // viewers intentionally বাদ
          }
        }
      }
    },
    { $project: { _id: 0 } }
  ])

  // my story: viewers থাকবে + populate হবে (userName,image)
  const myStoryPipeline = (myId) => ([
    { $match: { author: myId } },
    { $sort: { createdAt: -1 } },

    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author"
      }
    },
    { $unwind: "$author" },

    // viewers populate
    {
      $lookup: {
        from: "users",
        localField: "viewers",
        foreignField: "_id",
        as: "viewers"
      }
    },
    // viewers থেকে দরকারি field only
    {
      $addFields: {
        viewers: {
          $map: {
            input: "$viewers",
            as: "v",
            in: {
              _id: "$$v._id",
              userName: "$$v.userName",
              image: "$$v.image"
            }
          }
        }
      }
    },

    {
      $group: {
        _id: "$author._id",
        author: {
          $first: {
            _id: "$author._id",
            userName: "$author.userName",
            fullName: "$author.fullName",
            image: "$author.image"
          }
        },
        stories: {
          $push: {
            _id: "$_id",
            media: "$media",
            mediaTypes: "$mediaTypes",
            viewers: "$viewers",     // ✅ populated
            createdAt: "$createdAt"
          }
        }
      }
    },
    { $project: { _id: 0 } }
  ])

  const [stories, myStoryArr] = await Promise.all([
    followings.length
      ? Stories.aggregate(followingsPipeline({ $in: followings }))
      : Promise.resolve([]),

    Stories.aggregate(myStoryPipeline(user._id))
  ])

  const myStory = myStoryArr[0] || null

  return res.status(200).json(
    new ApiResponse(200, { stories, myStory }, "all story fetched successfully")
  )
})
