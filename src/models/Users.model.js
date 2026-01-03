import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        url: {
            type: String
        },
        publicId: {
            type: String
        }
    },
    bio: {
        type: String,
        maxlength: 150,
    },
    profession:{
        type: String
    },
    gender:{
        type: String,
        enum: ['male', 'female']
    },
    followings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }],
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Posts"
    }],
    stories: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stories"
    }
}, { timestamps: true })

const Users = mongoose.model('Users', userSchema)

export default Users