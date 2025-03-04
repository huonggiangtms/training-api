const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/", require("./users"));
router.use("/", require("./products"));
router.use("/", require("./cart"));
router.use("/", require("./orders"));

module.exports = router;
