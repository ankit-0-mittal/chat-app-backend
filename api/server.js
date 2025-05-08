const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv'); // ✅ Load env variables
const connectDB = require('../config/db');

// Load .env variables BEFORE connectDB()
dotenv.config();

const app = express();

// Connect to MongoDB AFTER loading .env
connectDB();

// CORS configuration
const allowedOrigins = [
 // Local dev'
 'http://localhost:3000', // ✅ Add your local frontend URL here
  'https://jazzy-platypus-b2ec5a.netlify.app/', // ✅ Add your deployed frontend URL here
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'), false);
    }
  },
  credentials: true,
};

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/chat', require('../routes/chat'));

// Export for serverless deployment
module.exports = app;
