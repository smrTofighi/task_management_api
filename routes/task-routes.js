const express = require("express");
const { protect, adminOnly } = require("../middlewares/auth-middleware");
const {
  getDashboardData,
  getUserDashboardData,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updatTaskChecklist,
} = require("../controllers/task-controller");
const router = express.Router();

//* Task Management Routes

router.get("/dashboard-data", protect, getDashboardData);
router.get("/user-dashboard-data",protect, getUserDashboardData);
router.get("/", protect, getTasks); //! Get all tasks (Admin: all, User: assigned)
router.get("/:id", protect, getTaskById); //! Get Task by ID
router.post("/", protect, adminOnly, createTask); //! Create Task (Admin Only)
router.put("/:id", protect, updateTask); //! Update Task details
router.delete("/:id", protect, adminOnly, deleteTask); //! Delete a task (Admin Only)
router.put("/:id/status", protect, updateTaskStatus); //* Update task status
router.put("/:id/todo", protect, updatTaskChecklist); //* Update task check list

module.exports = router;
