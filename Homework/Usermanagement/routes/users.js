const router = require("express").Router();
const User = require("../models/user.js");
const { authUser, authRole } = require("../auth/auth.js");
const crypto = require("crypto");

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

//Lấy thống tin user
//http://localhost:3000/api/users/me
router.get("/me", authUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Cập nhật profile
//localhost:3000/api/users/me
http: router.put("/me", async (req, res) => {
  try {
    // Lấy email và password từ headers
    const email = req.headers.email;
    const password = req.headers.password;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required in headers" });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra mật khẩu
    if (user.password !== hashPassword(password)) {
      return res.status(401).json({ message: "Incorrect password" });
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
router.get("/", authUser, authRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Không trả về password
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;
