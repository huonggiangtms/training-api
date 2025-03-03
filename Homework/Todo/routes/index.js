const express = require("express");
const router = express.Router();

router.use("/users", require("./users"));
router.use("/tasks", require("./tasks"));

module.exports = router;
