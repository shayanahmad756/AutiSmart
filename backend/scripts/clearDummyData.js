/**
 * Script to remove all non-admin users and all children from the database.
 * Keeps admin accounts intact.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Child from '../models/Child.js';
import ChildQuiz from '../models/ChildQuiz.js';
import AssessmentResult from '../models/AssessmentResult.js';
import Message from '../models/Message.js';

dotenv.config();

const clearDummyData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Remove all children
    const childResult = await Child.deleteMany({});
    console.log(`✅ Deleted ${childResult.deletedCount} children`);

    // Remove all child quizzes
    const quizResult = await ChildQuiz.deleteMany({});
    console.log(`✅ Deleted ${quizResult.deletedCount} child quizzes`);

    // Remove all assessment results
    const assessmentResult = await AssessmentResult.deleteMany({});
    console.log(`✅ Deleted ${assessmentResult.deletedCount} assessment results`);

    // Remove all chat messages
    const messageResult = await Message.deleteMany({});
    console.log(`✅ Deleted ${messageResult.deletedCount} messages`);

    // Remove all non-admin users
    const userResult = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`✅ Deleted ${userResult.deletedCount} non-admin users`);

    console.log('\n✅ All dummy data cleared. Admin accounts preserved.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
};

clearDummyData();
