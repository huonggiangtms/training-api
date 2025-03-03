const User = require("../models/user");

const authUser = async (req, res, next) => {
  try {
    const userId = req.headers["userid"]; // Lấy userId từ headers
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: userId is required" });
    }

    // Kiểm tra userId có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: Invalid userId" });
    }

    req.user = user; // Gán user vào request để dùng ở các route sau
    next(); // Tiếp tục xử lý route
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = authUser;
