const express = require('express');
const mongoose = require('mongoose');
const auth = require('./middleware/auth'); // Import the auth middleware
const logger = require('./middleware/logger'); // Import the logger middleware
const authRoutes = require('./routes/authRoute'); // Import authentication routes
const userRoutes = require('./routes/userRoute');
const stockRoutes = require('./routes/stockRoute');
const customerRoutes = require('./routes/customerRoute');
const userController = require('./controllers/userController');
const rawRoutes = require('./routes/rawRoute');
const app = express();
const port = 3000;

// Load environment variables from .env file
require('dotenv').config();
// Middleware to parse JSON
app.use(express.json());



// Logger middleware
app.use(logger);

app.use('/api', stockRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', rawRoutes);
app.use('/api', customerRoutes);
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