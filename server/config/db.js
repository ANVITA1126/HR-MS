const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrms');
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    console.log('TIP: Ensure your MongoDB server is running or provide a valid MONGO_URI in server/.env (e.g. MongoDB Atlas cluster URI)');
    // In production we would exit, but in dev we don't crash immediately so logs can be inspected
  }
};

module.exports = connectDB;
