const router = require("express").Router();
const Post = require("../models/post.js");
const User = require("../models/user.js");

//get post || get post by author and status
router.get("/", async (req, res) => {
  try {
    const { author, status } = req.query;
    let query = {};

    // Nếu có author, tìm ID của user và gán vào query
    if (author) {
      const user = await User.findOne({ name: new RegExp(author, "i") });
      if (!user) {
        return res.status(404).json({ message: "Author not found" });
      }
      query.author = user._id;
    }

    if (status !== undefined) {
      query.status = status === "true";
    }

    // Tìm tất cả bài viết thỏa điều kiện query
    const posts = await Post.find(query).populate("author", "name");

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get posts of a user (with optional filters: nowMonth, count)
router.get("/user", async (req, res) => {
  try {
    const { name, nowMonth, count } = req.query;
    let query = {};

    // Nếu có name, tìm user theo tên
    if (name) {
      const user = await User.findOne({ name: new RegExp(name, "i") });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      query.author = user._id;
    }

    // Nếu có nowMonth=true, chỉ lấy bài viết trong tháng hiện tại
    if (nowMonth === "true") {
      const now = new Date();
      query.createdAt = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    }

    // Nếu count=true, chỉ trả về số lượng bài
    if (count === "true") {
      const postCount = await Post.countDocuments(query);
      return res.json({ Number_of_posts: postCount });
    }

    // Lấy danh sách bài post nếu không có count
    const posts = await Post.find(query).populate("author", "name");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create post
router.post("/", async (req, res) => {
  const { author, title, content, status } = req.body;
  const errors = [];
  const user = await User.findById(author);
  if (!user) {
    res.status(400).json({ message: err.author });
  }
  if (!author) {
    errors.push("Author is required");
  }
  if (!title || title.lenght <= 3) {
    errors.push("title must least 3 character");
  }
  if (!content || title.lenght <= 5) {
    errors.push("content must least 3 character");
  }
  if (status === undefined) {
    errors.push("status is required");
  }
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  if (!user) {
    res.status(400).json({ message: err.author });
  }
  try {
    const newPost = new Post({
      author,
      title,
      content,
      status,
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// update posts
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    post.status = req.body.status ?? post.status;
    post.updatedAt = Date.now();

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// delete posts
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    await Post.deleteOne({ _id: req.params.id });
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
