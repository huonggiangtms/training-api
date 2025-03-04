const User = require("../models/user");

// Middleware kiểm tra token
const authUser = async (req, res, next) => {
  try {
    const token = req.header("authorization"); // truyền token ở header

    if (!token) {
      return res.status(401).json({ message: "Missing authentication token" });
    }

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = user; // Lưu thông tin user vào req để dùng tiếp
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// Middleware kiểm tra role
const authRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
};

module.exports = { authUser, authRole };
