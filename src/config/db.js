import mongoose from 'mongoose'

mongoose.set("bufferCommands", false);

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/vibegram`, {
            serverSelectionTimeoutMS: 30000,
        })
        console.log('database is connected')
    } catch (error) {
        console.log(`database connected failed`, error)
        throw error;
    }
}

export default connectDB