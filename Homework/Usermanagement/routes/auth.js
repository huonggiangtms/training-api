const router = require("express").Router();
const crypto = require("crypto");
const User = require("../models/user"); // Import model User

// Băm mật khẩu
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Hàm tạo token ngẫu nhiên ( 8 -> 16 kí tự, 16 -> 32 kí tự, 32 -> 64 kí tự)
function generateToken() {
  return crypto.randomBytes(8).toString("hex");
}

// Đăng kí (Sau khi đăng kí có link token gửi về)
//http://localhost:3000/api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const errors = [];

    if (!username || username.trim().length < 5) {
      errors.push("Username must be at least 5 characters long");
    }
    if (!email || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(email)) {
      errors.push("Invalid email format");
    }
    if (!password || password.trim().length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email used" });
    }

    // Tạo token để kích hoạt
    const activeToken = generateToken();

    // Tạo user mới
    const newUser = new User({
      username,
      email,
      password: hashPassword(password),
      role: role || "user",
      isVerified: false,
      activeToken,
    });
    await newUser.save();

    // link sẽ gửi về mail (vì không cần làm send về mail nên log tạm để lấy link)
    console.log(
      `Activation link: http://localhost:3000/api/auth/activate?token=${activeToken}`
    );

    res
      .status(201)
      .json({ message: "User registered. Check console for activation link." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// xác thực email sau khi đăng kí và nhận đc link token
//http://localhost:3000/api/auth/verify-email?token=50f5b5f7f9c132c4 - <link này được gửi về mail>
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Invalid link" });
    }

    const user = await User.findOne({ activeToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    user.isVerified = true;
    user.activeToken = null;
    await user.save();

    res.json({ message: "Verify email sucessfuly! Acount actived" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// đăng nhập sẽ có một mã token
//http://localhost:3000/api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== hashPassword(password)) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const token = generateToken();
    user.token = token;
    await user.save();

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// đăng xuất - mã token về null
//http:localhost:3000/api/auth/logout - nhập authorization: <mã token khi đăng nhập> ở header
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization; // Lấy token từ header

    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    user.token = null; // Xóa token
    await user.save();

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// đặt lại mật khẩu (nhập lại đúng mật khẩu cũ và mật khẩu mới)
// http://localhost:3000/api/auth/password
router.post("/password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    // Kiểm tra mật khẩu cũ có đúng không
    if (user.password !== hashPassword(oldPassword)) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Cập nhật mật khẩu mới
    user.password = hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// yêu cầu đặt link token để đặt lại mật khẩu (trường hợp quên mật khẩu cũ)
// http://localhost:3000/api/auth/password/forgot
router.post("/password/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    // Tạo token đặt lại mật khẩu
    const resetToken = generateToken();
    user.resetPasswordToken = resetToken;
    await user.save();

    console.log(
      `Reset password link: http://localhost:3000/api/auth/reset?token=${resetToken}`
    );

    res.json({ message: "Check console for reset password link." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// sau khi nhận được link token thì nhập pass mới
//http://localhost:3000/api/auth/password/reset?token=9d4693894490e464 <link này được gửi về mail>
router.post("/password/reset", async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Missing reset token" });
    }

    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Cập nhật mật khẩu mới
    user.password = hashPassword(newPassword);
    user.resetPasswordToken = null; // Xóa token sau khi sử dụng
    await user.save();

    res.json({ message: "Password reset successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Gửi lại email xác thực nếu chưa xác thực
//http://localhost:3000/api/auth/verify-email/resend
router.post("/verify-email/resend", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email not found" }); // không tìm thấy email
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" }); //email đã được xác thực
    }

    const newToken = generateToken();
    user.activeToken = newToken;
    await user.save();

    console.log(
      `New activation link: http://localhost:3000/api/auth/activate?token=${newToken}`
    );

    res.json({ message: "Check console for new activation link." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
