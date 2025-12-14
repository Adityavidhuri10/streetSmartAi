const express = require("express");
const { addReview, getReviews } = require("../controllers/reviewController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all reviews for a property
router.get("/:propertyId", getReviews);

// Add a new review (only tenants)
router.post("/:propertyId", protect, authorizeRoles("tenant"), addReview);

module.exports = router;
