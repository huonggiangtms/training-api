const router = require("express").Router();
const Order = require("../models/order");
const Product = require("../models/product");
const Cart = require("../models/cart");
const { authUser, authRole } = require("../auth/auth");

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
      status: "pending",
    });

    await newOrder.save();

    // Xóa các sản phẩm đã đặt khỏi giỏ hàng
    cart.items = cart.items.filter(
      (item) => !productIds.includes(item.product.toString())
    );

    await cart.save();

    res.status(201).json({ message: "Order successful", order: newOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xác nhận đơn hàng - Huỷ đơn hàng
//http://localhost:3000/api/order/67c6d22e3d86470d53674c00/confirm
router.put("/order/:id/confirm", authUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    // Kiểm tra trạng thái hợp lệ
    if (!["processing", "canceled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    // Tìm đơn hàng
    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({
        message: "Order not found or you do not have access",
      });
    }
    // Cập nhật trạng thái đơn hàng
    order.status = status;
    await order.save();
    res.json({ message: "Comfirm status successful", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xem danh sách đơn hàng của user
//http://localhost:3000/api/order/
router.get("/order", authUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xem chi tiết đơn hàng
//http://localhost:3000/api/order/67c6d22e3d86470d53674c00
router.get("/order/:id", authUser, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "not found order" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Quản lý trạng thái đơn hàng (đang xử lý, đã giao, đã hủy...)
//http://localhost:3000/api/admin/order/67c6d22e3d86470d53674c00/status
router.put(
  "/admin/order/:id/status",
  authUser,
  authRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["processing", "delivered", "canceled"].includes(status)) {
        return res.status(400).json({ message: "invalid status" });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: "not found order" });
      }

      order.status = status;
      await order.save();

      res.json({ message: "Update status successful", order });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
module.exports = router;
