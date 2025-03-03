const router = require("express").Router();
const Task = require("../models/task.js");
const authUser = require("../auth/auth.js");

// Get tasks - http://localhost:3000/api/tasks
router.get("/", authUser, async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.query;
    let query = {};

    if (title) query.title = new RegExp(title.trim(), "i");
    if (description) query.description = new RegExp(description.trim(), "i");
    if (status) query.status = new RegExp(status.trim(), "i");

    // Kiểm tra dueDate có đúng định dạng YYYY-MM-DD hay không
    if (dueDate) {
      const isValidDate =
        /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && !isNaN(Date.parse(dueDate));

      if (!isValidDate) {
        return res
          .status(400)
          .json({ message: "dueDate must be in YYYY-MM-DD format" });
      }

      // Chuyển dueDate thành đúng format Date trong MongoDB
      const startDate = new Date(dueDate);
      startDate.setHours(0, 0, 0, 0); // Đầu ngày

      const endDate = new Date(dueDate);
      endDate.setHours(23, 59, 59, 999); // Cuối ngày

      query.dueDate = { $gte: startDate, $lte: endDate }; // Lọc theo ngày
    }

    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task - http://localhost:3000/api/tasks
router.post("/", authUser, async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;
    const errors = [];

    // validate title
    if (!title || title.trim().length < 3) {
      errors.push("Title must be at least 3 characters long");
    }

    // validate description
    if (!description || description.trim().length < 5) {
      errors.push("Description must be at least 5 characters long");
    }
    if (dueDate && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ message: "dueDate is not valid" });
    }

    // Kiểm tra userId từ~ middleware
    const createdBy = req.user._id;
    if (!createdBy) {
      errors.push("User ID is required");
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const newTask = new Task({
      title,
      description,
      status,
      dueDate,
      createdBy,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update task - http://localhost:3000/api/tasks/:id
router.put("/:id", authUser, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    // Cập nhật giá trị
    task.title = req.body.title?.trim() || task.title;
    task.description = req.body.description?.trim() || task.description;
    task.status = req.body.status ?? task.status;

    if (req.body.dueDate) {
      if (!moment(req.body.dueDate, "YYYY-MM-DD", true).isValid()) {
        return res.status(400).json({ message: "Invalid dueDate format" });
      }
      task.dueDate = req.body.dueDate;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete task - http://localhost:3000/api/tasks/:id
router.delete("/:id", authUser, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Task.deleteOne({ _id: req.params.id });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
