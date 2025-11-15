// backend/controllers/discussionController.js
const Discussion = require("../models/discussionModel");
const asyncHandler = require("express-async-handler");

// GET /api/discussions
const getDiscussions = asyncHandler(async (req, res) => {
  const discussions = await Discussion.find()
    .populate("author", "name role")
    .populate("replies.author", "name role")
    .sort({ createdAt: -1 });

  res.json(discussions);
});

// POST /api/discussions  (protected)
const createDiscussion = asyncHandler(async (req, res) => {
  const { propertyTitle, locality, rating, text } = req.body;

  if (!propertyTitle || !locality || !rating || !text) {
    return res.status(400).json({ message: "All fields required" });
  }

  const discussion = await Discussion.create({
    propertyTitle,
    locality,
    rating,
    text,
    author: req.user._id,
  });

  // populate author before sending back
  await discussion.populate("author", "name role");

  res.status(201).json(discussion);
});

// POST /api/discussions/:discussionId/reply  (protected)
const addReply = asyncHandler(async (req, res) => {
  const { text, parentId } = req.body;
  const { discussionId } = req.params;

  if (!text) return res.status(400).json({ message: "Reply text required" });

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) return res.status(404).json({ message: "Discussion not found" });

  const newReply = {
    author: req.user._id,
    text,
    likes: 0,
    replies: [],
    createdAt: new Date(),
  };

  if (!parentId) {
    discussion.replies.push(newReply);
  } else {
    // recursive add nested reply
    const addNested = (arr) => {
      for (let r of arr) {
        if (r._id.toString() === parentId) {
          r.replies.push(newReply);
          return true;
        }
        if (r.replies && r.replies.length > 0) {
          const done = addNested(r.replies);
          if (done) return true;
        }
      }
      return false;
    };
    addNested(discussion.replies);
  }

  await discussion.save();
  res.json({ success: true });
});

// PUT /api/discussions/:discussionId/like  (protected)
const likeDiscussion = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;
  const discussion = await Discussion.findById(discussionId);
  if (!discussion) return res.status(404).json({ message: "Discussion not found" });

  discussion.likes = (discussion.likes || 0) + 1;
  await discussion.save();
  res.json({ likes: discussion.likes });
});

// PUT /api/discussions/:discussionId/reply/:replyId/like  (protected)
const likeReply = asyncHandler(async (req, res) => {
  const { discussionId, replyId } = req.params;

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) return res.status(404).json({ message: "Discussion not found" });

  const markLike = (arr) => {
    for (let r of arr) {
      if (r._id.toString() === replyId) {
        r.likes = (r.likes || 0) + 1;
        return true;
      }
      if (r.replies && r.replies.length > 0) {
        const found = markLike(r.replies);
        if (found) return true;
      }
    }
    return false;
  };

  markLike(discussion.replies);
  await discussion.save();
  res.json({ success: true });
});

module.exports = {
  getDiscussions,
  createDiscussion,
  addReply,
  likeDiscussion,
  likeReply,
};
