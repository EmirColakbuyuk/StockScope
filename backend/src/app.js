

const express = require('express');
const mongoose = require('mongoose');
const auth = require('./middleware/auth');
const { filterLogs } = require('./middleware/logger');
const authRoutes = require('./routes/authRoute');
const userRoutes = require('./routes/userRoute');
const stockRoutes = require('./routes/stockRoute');
const customerRoutes = require('./routes/customerRoute');
const supplierRoutes = require('./routes/supplierRoute');
const rawRoutes = require('./routes/rawRoute');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Load environment variables from .env file
require('dotenv').config();

require('./middleware/cron');

// Middleware to parse JSON
app.use(express.json());


// CORS ayarları
const corsOptions = {
  origin: (origin, callback) => {
    // CORS domainlerini dinamik olarak belirle
    // 'https://stock-scope-stage.herokuapp.com', 'https://stock-scope-stage-b7dd8b41e7a4.herokuapp.com',
    const allowedOrigins = ['http://localhost:3001', 'https://stock-scope-stage-b7dd8b41e7a4.herokuapp.com'];
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log(`CORS: Origin '${origin}' not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Tüm CORS talepleri için ayarları kullan
app.use(cors(corsOptions));

// Preflight istekleri için OPTIONS başlıklarını otomatik yönet
app.options('*', cors(corsOptions));

// Authentication routes (login/register) - NO auth middleware applied here
app.use('/api/auth', authRoutes);

// Apply auth middleware globally for all protected routes
app.use('/api', auth);


// API routes
app.use('/api', stockRoutes);
app.use('/api', rawRoutes);
app.use('/api', customerRoutes);
app.use('/api', supplierRoutes);
app.use('/api', userRoutes);


// Filter logs route (protected by auth, logger after auth)
app.get('/api/filter-logs', auth, (req, res) => {
  // Extract query parameters
  const { objectId, username, supplierId, customerId, page, pageSize } = req.query;
  console.log("Request Parameters:", { objectId, username, supplierId, customerId, page, pageSize }); // Debugging purpose

  // Parse `page` and `pageSize` as integers to avoid string issues
  const parsedPage = parseInt(page, 10) || 1; // Default to page 1 if not provided
  const parsedPageSize = parseInt(pageSize, 10) || 5; // Default to 5 logs per page if not provided

  // Call filterLogs with parsed parameters
  const filteredLogs = filterLogs(objectId, username, null, parsedPage, parsedPageSize, supplierId, customerId);

  // Send the filtered logs as response
  res.send(filteredLogs);
});



// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));


// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '..', 'public')));

// Handle all other routes by returning the React app's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Sunucu başlatma logları
console.log("Server initialization started");
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
console.log("Server initialization complete");
