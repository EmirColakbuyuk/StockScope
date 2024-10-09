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

    const updateData = { name, surname, username, email };

    if (password) {
      const passwordRegex = /^(?=.*\d).{7,}$/; // At least 7 characters with at least 1 number
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'Password must be at least 7 characters long and contain at least one number.' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const existingUser = await User.findOne({
      $or: [{ email }],
      _id: { $ne: id }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with the same email already exists.' });
    }

    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Updated user', updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};
// Get user by ID
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error getting user', error });
  }
};


// Get all users with only their usernames and roles
exports.getAllUsers = async (req, res) => {
  try {
    // Veritabanından tüm kullanıcıların sadece `username` ve `role` bilgilerini çekiyoruz
    const users = await User.find({}, 'username role');
    res.status(200).json(users);
  } catch (error) {
    console.error('Kullanıcılar alınırken hata oluştu:', error);
    res.status(500).json({ message: 'Kullanıcılar alınamadı.' });
  }
};