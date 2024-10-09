// authController.js

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Login attempt for username:', username);
    const user = await User.findOne({ username });
    if (!user) {
      console.log('No user found with username:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match for user:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user._id,
      username: user.username
    };
    console.log('Payload:', payload);
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1000000000000000h' });
    console.log('Generated Token:', token);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
