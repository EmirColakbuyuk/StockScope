const jwt = require('jsonwebtoken'); // Add this line
const User = require('../models/user');

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization denied' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // If the token is expired, auto-refresh it
      try {
        const decoded = jwt.decode(token); // Decode the expired token
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }

        // Generate a new token
        const newToken = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.setHeader('Authorization', `Bearer ${newToken}`); // Send the new token in response headers
        req.user = user;
        next();
      } catch (err) {
        return res.status(500).json({ message: 'Could not refresh token' });
      }
    } else {
      return res.status(401).json({ message: 'Token invalid' });
    }
  }
};

module.exports = auth;
