const router = require("express").Router();
const User = require("../models/user.js");
const { authUser, authRole } = require("../auth/auth.js");
const crypto = require("crypto");

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

//Lấy thống tin user
//http://localhost:3000/api/users/me
router.get("/users/me", authUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Cập nhật profile
// http://localhost:3000/api/users/me
router.put("/users/me", authUser, async (req, res) => {
  try {
    // Lấy user từ middleware authUser
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Lấy dữ liệu từ body
    const { username, newEmail, newPassword } = req.body;

    // Chỉ cập nhật nếu người dùng nhập vào
    if (username) user.username = username;
    if (newEmail) user.email = newEmail;
    if (newPassword) user.password = hashPassword(newPassword);

    // Lưu lại thông tin mới
    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//Role
//Lấy danh sách Users (Admin)
//http://localhost:3000/api/users
router.get("/admin/users", authUser, authRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Không trả về password
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;
