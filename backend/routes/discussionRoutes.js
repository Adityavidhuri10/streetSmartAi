const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createDiscussion,
  getDiscussions,
  addReply,
  likeDiscussion,
  likeReply,
  generateFakeDiscussion,
} = require("../controllers/discussionController");

const router = express.Router();

// Get all discussions
router.get("/", getDiscussions);

// Generate fake discussion (AI)
router.post("/generate", protect, generateFakeDiscussion);

// Create new discussion (tenant only)
router.post("/", protect, createDiscussion);

// Add a reply to a discussion
router.post("/:discussionId/reply", protect, addReply);

// Like a discussion
router.put("/:discussionId/like", protect, likeDiscussion);

// Like a reply inside a discussion
router.put("/:discussionId/reply/:replyId/like", protect, likeReply);

module.exports = router;
