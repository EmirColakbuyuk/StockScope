const fs = require('fs');
const path = require('path');

// Define the log file path
const logFilePath = path.join(__dirname, '..', 'logs', 'access.log');

// Ensure the logs directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'logs'));
}

// Logger middleware
const logger = (req, res, next) => {
  let username = 'Anonymous';

  // Check for authenticated user or email in the request body
  if (req.user) {
    username = req.user.username; // When user is authenticated
  } else if (req.body.email) {
    username = req.body.email; // Use email when logging in
  }

  // Clone request body and remove password if present
  const sanitizedRequestBody = { ...req.body };
  if (sanitizedRequestBody.password) {
    delete sanitizedRequestBody.password;
  }

  // Capture the original json function
  const originalJson = res.json;

  // Wrap the json function to log the response
  res.json = function (body) {
    // Extract the objectId and objectType from URL or response body if available
    const { objectId, objectType } = extractObjectId(req, body);

    // Log details
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      user: username,
      objectId: objectId || null,
      objectType: objectType || null,
      requestBody: sanitizedRequestBody, // Use sanitized body here
      responseBody: body // Use the original body as it's already an object
    };

    // If it's a PATCH method and the status is changed, add a custom message
    if (req.method === 'PATCH' && body && body.rawMaterial) {
      if (body.rawMaterial.status === 'active') {
        logEntry.details = 'Stoğa girişi yapılmıştır';
      } else if (body.rawMaterial.status === 'passive') {
        logEntry.details = 'Stoktan çıkışı yapılmıştır';
      }
    }

    // Write log entry as a single JSON string
    fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');

    // Call the original json method with the body
    originalJson.call(this, body);
  };

  next();
};

// Function to extract the objectId and objectType from request URL or response body
const extractObjectId = (req, body) => {
  let objectId = null;
  let objectType = null;

  // Example: Extract objectId and objectType from URL
  const urlMatch = req.originalUrl.match(/\/api\/(\w+)\/([^\/]+)/);
  if (urlMatch) {
    objectType = urlMatch[1]; // The first capture group is the type (e.g., "rawMaterial", "stock")
    objectId = urlMatch[2];   // The second capture group is the objectId
    return { objectId, objectType };
  }

  // Check if body is already an object
  let responseJson;
  if (typeof body === 'string') {
    try {
      responseJson = JSON.parse(body); // Parse only if it's a string
    } catch (e) {
      console.error('Error parsing response JSON:', e);
      return { objectId, objectType };
    }
  } else {
    responseJson = body; // If it's not a string, use as-is
  }

  // Example: Extract objectId and objectType from response body
  if (responseJson.rawMaterial && responseJson.rawMaterial._id) {
    objectId = responseJson.rawMaterial._id;
    objectType = 'rawMaterial';
  } else if (responseJson.stock && responseJson.stock._id) {
    objectId = responseJson.stock._id;
    objectType = 'stock';
  } else if (responseJson.customer && responseJson.customer._id) {
    objectId = responseJson.customer._id;
    objectType = 'customer';
  } else if (responseJson.supplier && responseJson.supplier._id) {
    objectId = responseJson.supplier._id;
    objectType = 'supplier';
  }

  return { objectId, objectType };
};

// Function to filter logs based on objectId, username, objectType, supplierId, or customerId
const filterLogs = (objectId, username, objectType, page = 1, pageSize = 5, supplierId = null, customerId = null) => {
  // Read logs from file
  const logs = fs.readFileSync(logFilePath, 'utf-8').split('\n').filter(Boolean);
  

  // Parse and filter logs based on parameters
  const filteredLogs = logs
    .map(log => {
      try {
        const parsedLog = JSON.parse(log);
        
        return parsedLog;
      } catch (e) {
        
        return null;
      }
    })
    .filter(log => {
      if (!log) return false;

      // Match standard filters (objectId, username, objectType)
      const matchObjectId = objectId ? log.objectId === objectId : true;
      const matchUsername = username ? log.user === username : true;
      const matchObjectType = objectType ? log.objectType === objectType : true;

      // Check if log is a supplier action or related rawMaterial entry for a specific supplierId
      const matchSupplierLogs = supplierId ? checkSupplierLogs(log, supplierId) : true;

      // Include the log only if it matches all the criteria
      return log && matchObjectId && matchUsername && matchObjectType && matchSupplierLogs;
    });

  

  // Pagination logic
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Returning pagination metadata along with the filtered logs
  return {
    page,
    pageSize,
    totalLogs: filteredLogs.length,
    totalPages: Math.ceil(filteredLogs.length / pageSize),
    data: paginatedLogs
  };
};

// Helper function to check if a log is related to a supplier or rawMaterial associated with a supplier
const checkSupplierLogs = (log, supplierId) => {
  
  if (!log || !log.requestBody) {
    return false;
  }

  const { requestBody } = log;

  // Check if the log's objectType is 'rawMaterial' and the supplier in requestBody matches supplierId
  const isRawMaterialFromSupplier = log.objectType === 'rawMaterial' && requestBody.supplier === supplierId;

  return isRawMaterialFromSupplier;
};

module.exports = { logger, filterLogs };
