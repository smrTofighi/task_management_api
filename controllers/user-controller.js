const Task = require("../models/task-model");
const User = require("../models/user-model");
const bcrypt = require("bcryptjs");

// @desc Get all users (Admin Only)
// @route GET /api/users/
// @access Private (Admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "member" }).select("-password");
    // Add task counts to each user
    const userWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const pendingTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: 0,
        });
        const inProgressTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: 1,
        });
        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: 2,
        });
        return {
          ...user._doc, //! Include all existing user data
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };
      })
    );
    res.status(200).json(userWithTaskCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get user by ID
// @route GET /api/users/:id
// @access Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = {
  getUsers,
  getUserById,
  
};
