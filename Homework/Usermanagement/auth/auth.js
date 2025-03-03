const User = require("../models/user");
const crypto = require("crypto");

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// kiểm tra user tồn tại không?
const authUser = async (req, res, next) => {
  try {
    const email = req.header("email");
    const password = req.header("password");

    console.log("Received Email:", email);
    console.log("Received Password:", password);

    if (!email || !password) {
      return res
        .status(401)
        .json({ message: "Missing authentication headers" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", user);

    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// kiểm tra role
const authRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
};

module.exports = { authUser, authRole };
