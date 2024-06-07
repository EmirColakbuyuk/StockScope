const express = require('express');
const mongoose = require('mongoose');
const auth = require('./middleware/auth'); // Import the auth middleware
const logger = require('./middleware/logger'); // Import the logger middleware
const authRoutes = require('./routes/authRoute'); // Import authentication routes
const userRoutes = require('./routes/userRoute');
const userController = require('./controllers/userController');
const app = express();
const port = 3000;



// Load environment variables from .env file
require('dotenv').config();

// Middleware to parse JSON
app.use(express.json());

// Logger middleware
app.use(logger);

app.use('/api/auth', authRoutes);

// Use auth middleware for all routes except POST /api/users (for registration)
app.use('/api/users', (req, res, next) => {
  if (req.method === 'POST') {
    return next();
  }
  auth(req, res, next);
});

// Use user routes
app.use('/api', userRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.error('Could not connect to MongoDB...', err));

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});