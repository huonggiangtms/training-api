const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed"],
    default: "pending",
  },
  dueDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Task", taskSchema);
