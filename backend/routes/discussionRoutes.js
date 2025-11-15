const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createDiscussion,
  getDiscussions,
  addReply,
  likeDiscussion,
  likeReply,
} = require("../controllers/discussionController");

const router = express.Router();

// Get all discussions
router.get("/", getDiscussions);

// Create new discussion (tenant only)
router.post("/", protect, createDiscussion);

// Add a reply to a discussion
router.post("/:discussionId/reply", protect, addReply);

// Like a discussion
router.put("/:discussionId/like", protect, likeDiscussion);

// Like a reply inside a discussion
router.put("/:discussionId/reply/:replyId/like", protect, likeReply);

module.exports = router;
