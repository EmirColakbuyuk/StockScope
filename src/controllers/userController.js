const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Add a new user
exports.addUser = async (req, res) => {
  try {
    const { name, surname, username, email, password, role } = req.body;

    const newUser = new User({ name, surname, username, email, password, role });
    const savedUser = await newUser.save();
    res.status(201).json({ message: 'Created user', savedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};

// Update user access level
exports.updateUserAccessLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, surname, username, email, password } = req.body;

    
    const passwordRegex = /^(?=.*\d).{7,}$/; // At least 7 characters with at least 1 number
    if (password && !passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 7 characters long and contain at least one number.' });
    }

    // Check if user with the same surname or email already exists (except for the current user)
    const existingUser = await User.findOne({
      $or: [{ surname }, { email }],
      _id: { $ne: id } 
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with the same surname or email already exists.' });
    }

    const updateData = { name, surname, username, email, password };

    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Updated user', updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};