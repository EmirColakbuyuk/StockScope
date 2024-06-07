const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Unified error message for any login error
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let isMatch = false; // Declare isMatch here
    // Compare passwords
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Error comparing password:', error);
    }

    // Check if passwords match 
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    

    res.json({ token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error' }); // Avoid leaking specific error details
  }
};
