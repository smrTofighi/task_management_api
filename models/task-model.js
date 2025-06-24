const mongoose = require("mongoose");
const { create } = require("./user-model");

const TodoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    priority: {
      type: Number,
      enum: [1, 2, 3],
      default: 2,
    },
    status: {
      type: Number,
      enum: [0, 1, 2], // 0: Pending, 1: In Progress, 2: Completed,
      default: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attachments: [
      {
        type: String,
      },
    ],
    todoChecklist: [TodoSchema],
    progress: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", TaskSchema);
