import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fln';

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully to', MONGODB_URI.split('@')[1] || MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
