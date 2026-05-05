const queries = require("../db/queries");
const { body, validationResult, matchedData } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const validateSignUpFields = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 7 })
    .withMessage("Password must be at least 7 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one symbol"),
  body("confirmPassword")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Password doesn't match"),
];

const validateArticle = [
  body("title").trim().notEmpty().withMessage("Title is required"),

  body("body").trim().notEmpty().withMessage("Body is required"),
];

const validateComment = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Empty comment cannot be created"),
];

const createUser = [
  validateSignUpFields,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.mapped() });
    }

    const result = matchedData(req);
    try {
      const hashPassword = await bcrypt.hash(result.password, 10);
      await queries.createUser("user", result.username, hashPassword);
      return res.status(201).json({
        success: true,
        message: "User created successfully",
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          errors: {
            username: { msg: "Sorry, username already taken!" },
          },
        });
      }
      return next(error);
    }
  },
];

const loginUser = [
  async (req, res, next) => {
    const { username, password } = req.body;

    try {
      // 1. Find user
      const user = await queries.findUserByUsername(username);
      if (!user) {
        return res.status(400).json({
          errors: { username: { msg: "User not found" } },
        });
      }

      // 2. Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          errors: { password: { msg: "Invalid password" } },
        });
      }

      // 3. Generate JWT
      const payload = { id: user.id, username: user.username, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "10h",
      });

      // 4. Send token
      return res.json({
        success: true,
        token,
      });
    } catch (error) {
      return next(error);
    }
  },
];

const protected = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ msg: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Malformed token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ msg: "Forbidden" });
  }
  next();
};

const adminAndCommentOwnerOnly = async (req, res, next) => {
  try {
    const comment = await queries.oneComment(Number(req.params.id));
    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }
    if (req.user.role === "Admin" || req.user.id === comment.userId) {
      return next();
    }

    return res.status(403).json({ msg: "Forbidden" });
  } catch (error) {
    return next(error);
  }
};

const listAllArticles = async (req, res, next) => {
  try {
    const allArticles = await queries.allArticles();
    return res.status(200).json({
      success: true,
      data: allArticles,
    });
  } catch (error) {
    return next(error);
  }
};

const listPublishedArticles = async (req, res, next) => {
  try {
    const publishedArticles = await queries.publishedArticles();
    return res.status(200).json({
      success: true,
      data: publishedArticles,
    });
  } catch (error) {
    return next(error);
  }
};

const oneArticle = async (req, res, next) => {
  try {
    const article = await queries.oneArticle(Number(req.params.id));
    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    return next(error);
  }
};

const addArticle = [
  validateArticle,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
      }

      const result = matchedData(req);
      await queries.createArticle(result.title, result.body, req.user.id);
      return res.status(200).json({
        success: true,
        data: "Article successfully created",
      });
    } catch (error) {
      return next(error);
    }
  },
];

const publish = async (req, res, next) => {
  try {
    await queries.publish(Number(req.params.id));
    return res.status(200).json({
      success: true,
      data: "Article successfully published",
    });
  } catch (error) {
    return next(error);
  }
};

const unPublish = async (req, res, next) => {
  try {
    await queries.unPublish(Number(req.params.id));
    return res.status(200).json({
      success: true,
      data: "Article successfully Unpublished",
    });
  } catch (error) {
    return next(error);
  }
};

const updateArticle = [
  validateArticle,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
      }

      const result = matchedData(req);
      await queries.updateArticle(
        result.title,
        result.body,
        Number(req.params.id),
      );
      return res.status(200).json({
        success: true,
        data: "Article successfully updated",
      });
    } catch (error) {
      return next(error);
    }
  },
];

const deleteArticle = async (req, res, next) => {
  try {
    await queries.deleteArticle(Number(req.params.id));
    return res.status(200).json({
      success: true,
      data: "Article successfully deleted",
    });
  } catch (error) {
    return next(error);
  }
};

const commentOwnerOnly = async (req, res, next) => {
  const comment = await queries.oneComment(Number(req.params.id));

  if (!comment) {
    return res.status(404).json({ msg: "Comment not found" });
  }

  if (req.user.id === comment.userId || req.user.role === "Admin") {
    return next();
  }

  return res.status(403).json({ msg: "Forbidden" });
};

const addComment = [
  validateComment,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
      }

      const result = matchedData(req);
      await queries.createComment(
        Number(req.params.articleId),
        result.comment,
        req.user.id,
      );
      return res.status(200).json({
        success: true,
        data: "Comment successfully created",
      });
    } catch (error) {
      return next(error);
    }
  },
];

const updateComment = [
  validateComment,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
      }

      const result = matchedData(req);
      await queries.updateComment(Number(req.params.id), result.comment);
      return res.status(200).json({
        success: true,
        data: "Comment successfully updated",
      });
    } catch (error) {
      return next(error);
    }
  },
];

const deleteComment = async (req, res, next) => {
  try {
    await queries.deleteComment(Number(req.params.id));
    return res.status(200).json({
      success: true,
      data: "Comment successfully deleted",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createUser,
  loginUser,
  protected,
  requireAdmin,
  adminAndCommentOwnerOnly,
  listPublishedArticles,
  listAllArticles,
  oneArticle,
  addArticle,
  updateArticle,
  deleteArticle,
  commentOwnerOnly,
  addComment,
  updateComment,
  deleteComment,
  publish,
  unPublish,
};
