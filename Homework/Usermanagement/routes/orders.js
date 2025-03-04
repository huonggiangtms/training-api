const router = require("express").Router();
const Order = require("../models/order");
const Product = require("../models/product");
const Cart = require("../models/cart");
const { authUser } = require("../auth/auth");

// 3. Order Processing (Xử lý đơn hàng)

// Tạo đơn hàng mới từ giỏ hàng
//http://localhost:3000/api/order/
router.post("/order", authUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { productIds } = req.body;

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ message: "Please choose product" });
    }

    // Tìm các sản phẩm trong giỏ hàng của user
    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Cart empty" });
    }

    // Lọc ra các sản phẩm có trong danh sách đặt hàng
    const orderItems = cart.items.filter((item) =>
      productIds.includes(item.product.toString())
    );

    if (orderItems.length === 0) {
      return res
        .status(404)
        .json({ message: "Not found the product in the cart" });
    }

    // Tính tổng giá trị đơn hàng
    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Tạo đơn hàng mới
    const newOrder = new Order({
      user: userId,
      items: orderItems,
      total: total,
      status: "processing",
    });

    await newOrder.save();

    // Xóa các sản phẩm đã đặt khỏi giỏ hàng
    cart.items = cart.items.filter(
      (item) => !productIds.includes(item.product.toString())
    );

    await cart.save();

    res.status(201).json({ message: "Đặt hàng thành công", order: newOrder });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: err.message,
    });
  }
});

// Xác nhận đơn hàng
//http://localhost:3000/api/order/67c6d22e3d86470d53674c00/confirm
router.put("/order/:id/confirm", authUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    // Kiểm tra trạng thái hợp lệ
    if (!["confirmed", "canceled"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }
    // Tìm đơn hàng
    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({
        message:
          "Không tìm thấy đơn hàng hoặc bạn không có quyền xác nhận đơn hàng này.",
      });
    }
    // Cập nhật trạng thái đơn hàng
    order.status = status;
    await order.save();
    res.json({ message: "Xác nhận đơn hàng thành công", order });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
});
module.exports = router;
