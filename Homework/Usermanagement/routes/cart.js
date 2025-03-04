const router = require("express").Router();
const Cart = require("../models/cart");
const Product = require("../models/product");
const { authUser } = require("../auth/auth.js");

// 2. Shopping Cart Functionality (Giỏ hàng)
// Thêm sản phẩm vào giỏ hàng
// http://localhost:3000/api/cart/add
router.post("/cart/add", authUser, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const errors = [];

    if (!productId) {
      errors.push("Product is required");
    }
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      errors.push("Quantity must be a positive number");
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    //  Thumbnaillấy từ product
    const thumbnail = product.thumbnail;

    // Tìm giỏ hàng của user
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] }); // nếu không có giỏ hàng tạo mới
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity; // nếu có rồi thì tăng số lượng lên
    } else {
      // nếu chưa thì thêm vào giỏ
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        thumbnail: product.thumbnail,
      });
    }

    await cart.save();
    res.status(201).json({ message: "Product added to cart", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
// http://localhost:3000/api/cart/update
router.put("/cart/update", authUser, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || quantity <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) return res.status(404).json({ message: "Product not in cart" });

    item.quantity = quantity;
    await cart.save();
    res.status(200).json({ message: "Updated product", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xóa sản phẩm khỏi giỏ hàng
// http://localhost:3000/api/cart/remove/67c508770614162968fbfc0b
router.delete("/cart/remove/:productId", authUser, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    res.status(200).json({ message: "Removed product", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xem danh sách sản phẩm trong giỏ hàng
// http://localhost:3000/api/cart
router.get("/cart", authUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
