const Task = require("../models/task-model");

// @desc Get all tasks (Admin: all, Users: only assigned tasks)
// @route GET /api/tasks/
// @access Private
const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    console.log(status);

    let filter = {};
    if (status) {
      filter.status = status;
    }

    let tasks;
    if (req.user.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    } else {
      tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    }

    // Add comleted todoCkecklist count to each task
    tasks = await Promise.all(
      tasks.map(async (task) => {
        const completedCount = task.todoChecklist.filter(
          (item) => item.completed
        ).length;
        return { ...task._doc, completedTodoCount: completedCount };
      })
    );
    // status summary counts
    const allTasks = await Task.countDocuments(
      req.user.role !== "admin" && { assignedTo: req.user._id }
    );

    const pendingTasks = await Task.countDocuments({
      ...filter,
      status: 0,
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const inProgressTasks = await Task.countDocuments({
      ...filter,
      status: 1,
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const completedTasks = await Task.countDocuments({
      ...filter,
      status: 2,
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    res.status(200).json({
      tasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get Task by ID
// @route GET /api/tasks/:id
// @access Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Create a new task (Admin only)
// @route POST /api/tasks/
// @access Private (Admin)
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    } = req.body;
    if (!Array.isArray(assignedTo)) {
      return res.status(400).json({
        message: "Assigned to must be an array of user IDs",
      });
    }
    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      todoChecklist,
      attachments,
    });
    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update task details
// @route PUT /api/tasks/:id
// @access Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
    task.attachments = req.body.attachments || task.attachments;
    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return res.status(400).json({
          message: "Assigned to must be an array of user IDs",
        });
      }
      task.assignedTo = req.body.assignedTo;
    }
    const updatedTask = await task.save();
    res.status(200).json({
      message: "Task updated successfully",
      updatedTask,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Delete task status
// @route POST /api/tasks/.;
// @access Private (Admin)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    await task.deleteOne();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update task status
// @route PUT /api/tasks/:id/status
// @access Private
const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    ); //! check if user is assigned to the task
    if (!isAssigned && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this task" });
    }
    task.status = req.body.status || task.status;

    if (task.status === 2) {
      task.todoChecklist.forEach((item) => (item.completed = true));
      task.progress = 100;
    }
    await task.save();
    res.json({ message: "Task status updated successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update task checklist
// @route POST /api/tasks/:id/todo
// @access Private
const updatTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Not authorized to update this task",
      });
    }
    task.todoChecklist = todoChecklist; // Replace with updated checkList

    //? Auto-update progress based on checklist completion
    const completedCount = task.todoChecklist.filter(
      (item) => item.completed
    ).length;
    console.log(completedCount);

    const totalItems = task.todoChecklist.length;
    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    //? Auto-mark task as completed if all items are checked
    if (task.progress === 100) {
      task.status = 2;
    } else if (task.progress > 0) {
      task.status = 1;
    } else {
      task.status = 0;
    }
    await task.save();

    const updatedTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );
    res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Dashboard Data (Admin Only)
// @route GET /api/tasks/dashboard-data
// @access Private (Admin)
const getDashboardData = async (req, res) => {
  try {
    //? Fetch statistics
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 0 });
    const completedTasks = await Task.countDocuments({ status: 2 });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: 2 },
      dueDate: { $lt: new Date() },
    });

    //? Ensure all possible statuses are includes
    const statusMap = {
      0: "Pending",
      1: "InProgress",
      2: "Completed",
    };

    const statusNumbers = Object.keys(statusMap).map(Number);

    const taskDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$status", // status is a number like 0, 1, 2
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = statusNumbers.reduce((acc, statusNum) => {
      const key = statusMap[statusNum];
      const item = taskDistributionRaw.find((item) => item._id === statusNum);
      acc[key] = item?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    //? Ensure all priority levels are included
    const priorityMap = {
      1: "Low",
      2: "Medium",
      3: "High",
    };
    const priorityNumbers = Object.keys(priorityMap).map(Number);
    const priorityDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);
    const priorityLevels = priorityNumbers.reduce((acc, priority) => {
      const key = priorityMap[priority];
      const item = priorityDistributionRaw.find(
        (item) => item._id === priority
      );
      acc[key] = item?.count || 0;
      return acc;
    }, {});

    //? Fetch top recent 10 tasks
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");
    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        priorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// @desc Dashboard Data (User-Specific)
// @route GET /api/tasks/user-dashboard-data
// @access Private
const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id; //* only fetch data for the logged-in user

    //? Fetch statistics for user-specific tasks
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: 0,
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: 2,
    });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $ne: 2 },
      dueDate: { $lt: new Date() },
    });

    //? Task distribution by status
    const statusMap = {
      0: "Pending",
      1: "InProgress",
      2: "Completed",
    };

    const statusNumbers = Object.keys(statusMap).map(Number);

    const taskDistributionRaw = await Task.aggregate([
      {
        $match: {
          assignedTo: userId,
        },
      },
      {
        $group: {
          _id: "$status", // status is a number like 0, 1, 2
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = statusNumbers.reduce((acc, statusNum) => {
      const key = statusMap[statusNum];
      const item = taskDistributionRaw.find((item) => item._id === statusNum);
      acc[key] = item?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    //? Task distribution by priority
    const priorityMap = {
      1: "Low",
      2: "Medium",
      3: "High",
    };
    const priorityNumbers = Object.keys(priorityMap).map(Number);
    const priorityDistributionRaw = await Task.aggregate([
      {
        $match: {
          assignedTo: userId,
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);
    const priorityLevels = priorityNumbers.reduce((acc, priority) => {
      const key = priorityMap[priority];
      const item = priorityDistributionRaw.find(
        (item) => item._id === priority
      );
      acc[key] = item?.count || 0;
      return acc;
    }, {});

    //? Fetch top recent 10 tasks
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        priorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updatTaskChecklist,
  getDashboardData,
  getUserDashboardData,
};
