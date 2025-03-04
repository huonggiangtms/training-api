const router = require("express").Router();
const Product = require("../models/product");
const { authUser, authRole } = require("../auth/auth.js");

// 1. Product Management (Quản lý sản phẩm)
// Thêm sản phẩm mới(name, description, sku(mã sản phẩm), price, qty(số lượng hiện có), thumbnail, image, createdAt, updatetAt)
// http://localhost:3000/api/admin/add-product
router.post(
  "/admin/add-product",
  authUser,
  authRole(["admin"]),
  async (req, res) => {
    try {
      let { name, description, sku, price, quantity, thumbnail, image } =
        req.body;
      const errors = [];

      if (!name || name.trim().length < 5) {
        errors.push("name must be at least 5 characters long");
      }
      if (!description || description.trim().length < 6) {
        errors.push("description must be at least 6 characters long");
      }
      if (!sku || sku.trim().length < 2) {
        errors.push("sku must be at least 2 characters long");
      }
      if (price === undefined || price < 0) {
        errors.push("price must be a positive number");
      }
      if (quantity === undefined || quantity < 0) {
        errors.push("quantity must be a positive number");
      }
      // Gán giá trị mặc định nếu thiếu thumbnail hoặc image
      thumbnail = thumbnail || "https://picsum.photos/200/300";
      image = image || "https://picsum.photos/200";

      // Kiểm tra sku đã tồn tại chưa
      const checkSku = await Product.findOne({ sku });
      if (checkSku) {
        return res.status(409).json({ message: "sku added" });
      }
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const newProduct = new Product({
        name,
        description,
        sku,
        price,
        quantity,
        thumbnail,
        image,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newProduct.save();
      res.status(201).json({ message: "Create Product Succesful" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
// Lấy danh sách sản phẩm
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
