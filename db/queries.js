const prisma = require("../lib/prisma");

async function createUser(role, name, password) {
  await prisma.user.create({
    data: {
      role,
      username: name,
      password,
    },
  });
}

async function findUserByUsername(username) {
  return await prisma.user.findUnique({
    where: { username },
  });
}

async function allArticles() {
  return await prisma.post.findMany({
    include: {
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });
}

async function publishedArticles() {
  return await prisma.post.findMany({
    where: { published: true },
    include: {
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });
}

async function oneArticle(id) {
  return await prisma.post.findFirst({
    where: { id, published: true },
    include: {
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });
}

async function createArticle(title, body, id) {
  await prisma.post.create({
    data: {
      title,
      body,
      userId: id,
    },
  });
}

async function publish(id) {
  await prisma.post.update({
    where: { id },
    data: { published: true },
  });
}

async function unPublish(id) {
  await prisma.post.update({
    where: { id },
    data: { published: false },
  });
}

async function updateArticle(title, body, id) {
  await prisma.post.update({
    where: { id },
    data: { title, body },
  });
}

async function deleteArticle(id) {
  await prisma.post.delete({
    where: { id },
  });
}

async function createComment(id, body, userId) {
  await prisma.comment.create({
    data: {
      body,
      postId: id,
      userId,
    },
  });
}

async function oneComment(id) {
  return await prisma.comment.findUnique({
    where: { id },
  });
}

async function updateComment(id, body) {
  await prisma.comment.update({
    where: { id },
    data: { body },
  });
}

async function deleteComment(id) {
  await prisma.comment.delete({
    where: { id },
  });
}

module.exports = {
  createUser,
  findUserByUsername,
  allArticles,
  publishedArticles,
  oneArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  createComment,
  oneComment,
  updateComment,
  deleteComment,
  publish,
  unPublish,
};
