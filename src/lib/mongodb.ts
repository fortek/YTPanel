import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState >= 1) return

    await mongoose.connect(MONGODB_URI as string)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

export default connectToDatabase 