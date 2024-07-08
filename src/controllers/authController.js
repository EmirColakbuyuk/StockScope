// const User = require('../models/user');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
//
// exports.login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     // Find user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       // Unified error message for any login error
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }
//
//     let isMatch = false; // Declare isMatch here
//     // Compare passwords
//     try {
//       isMatch = await bcrypt.compare(password, user.password);
//     } catch (error) {
//       console.error('Error comparing password:', error);
//     }
//
//     // Check if passwords match
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }
//
//     // Generate JWT token
//     const payload = { id: user._id };
//     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
//
//
//     res.json({ token });
//   } catch (error) {
//     console.error('Error logging in user:', error);
//     res.status(500).json({ message: 'Internal server error' }); // Avoid leaking specific error details
//   }
// };



const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Login attempt for email:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user._id,
      username: user.username // Username bilgisini ekliyoruz
    };
    console.log('Payload:', payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated Token:', token);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


