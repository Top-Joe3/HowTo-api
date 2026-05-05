const router = require("express").Router();
const controllers = require("../controllers/controllers.js");

router.post("/users", controllers.createUser);
router.post("/login", controllers.loginUser);
router.get(
  "/articles/all",
  controllers.protected,
  controllers.requireAdmin,
  controllers.listAllArticles,
);
router.get("/articles/published", controllers.listPublishedArticles);
router.get("/articles/:id", controllers.oneArticle);
router.patch(
  "/articles/:id/publish",
  controllers.protected,
  controllers.requireAdmin,
  controllers.publish,
);
router.patch(
  "/articles/:id/unPublish",
  controllers.protected,
  controllers.requireAdmin,
  controllers.unPublish,
);
router.post(
  "/articles",
  controllers.protected,
  controllers.requireAdmin,
  controllers.addArticle,
);
router.patch(
  "/articles/:id",
  controllers.protected,
  controllers.requireAdmin,
  controllers.updateArticle,
);
router.delete(
  "/articles/:id",
  controllers.protected,
  controllers.requireAdmin,
  controllers.deleteArticle,
);

router.post(
  "/articles/:articleId/comments",
  controllers.protected,
  controllers.addComment,
);
router.patch(
  "/comments/:id",
  controllers.protected,
  controllers.commentOwnerOnly,
  controllers.updateComment,
);
router.delete(
  "/comments/:id",
  controllers.protected,
  controllers.adminAndCommentOwnerOnly,
  controllers.deleteComment,
);

module.exports = router;
