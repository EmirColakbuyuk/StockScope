// app.js or server.js

const express = require('express');
const mongoose = require('mongoose');
const auth = require('./middleware/auth'); // Import the auth middleware
const { logger, filterLogs } = require('./middleware/logger'); // Import the logger and filterLogs functions
const authRoutes = require('./routes/authRoute'); // Import authentication routes
const userRoutes = require('./routes/userRoute');
const stockRoutes = require('./routes/stockRoute');
const customerRoutes = require('./routes/customerRoute');
const supplierRoutes = require('./routes/supplierRoute');
const rawRoutes = require('./routes/rawRoute');
const cors = require('cors');
const app = express();
const port = 3000;

// Load environment variables from .env file
require('dotenv').config();

require('./middleware/cron');

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3001'
}));

// Authentication routes (login/register) - NO auth middleware applied here
app.use('/api/auth', authRoutes);

// Apply auth middleware globally for all protected routes
app.use('/api', auth);

// Apply logger middleware globally for all routes after auth is checked
app.use('/api', logger);



// API routes
app.use('/api', stockRoutes);
app.use('/api', rawRoutes);
app.use('/api', customerRoutes);
app.use('/api', supplierRoutes);
app.use('/api', userRoutes);

// Filter logs route (protected by auth, logger after auth)
app.get('/api/filter-logs', auth, (req, res) => {
  const { objectId, username } = req.query;
  const filteredLogs = filterLogs(objectId, username);
  res.send(filteredLogs);
});

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
