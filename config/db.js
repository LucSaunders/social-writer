const mongoose = require('mongoose');
const config = require('config');

// Create variable to hold the mongoURI in default.json file
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    // mongoose.connect returns a promise, so use await
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true
    });

    console.log('MongoDB connected...');
  } catch (error) {
    console.error(error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
