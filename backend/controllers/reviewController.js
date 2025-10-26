const Review = require("../models/reviewModel");
const Property = require("../models/propertyModel");
const asyncHandler = require("express-async-handler");

// @desc    Add review for property
// @route   POST /api/reviews/:propertyId
// @access  Private (Tenant)
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const propertyId = req.params.propertyId;

  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  // Check if user already reviewed
  const existing = await Review.findOne({
    property: propertyId,
    user: req.user._id,
  });

  if (existing) {
    res.status(400);
    throw new Error("You have already reviewed this property");
  }

  const review = await Review.create({
    property: propertyId,
    user: req.user._id,
    rating,
    comment,
  });

  // Update average rating for property
  const reviews = await Review.find({ property: propertyId });
  const avgRating =
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  property.avgRating = avgRating;
  await property.save();

  res.status(201).json(review);
});

// @desc    Get reviews for a property
// @route   GET /api/reviews/:propertyId
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ property: req.params.propertyId })
    .populate("user", "name role")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

module.exports = { addReview, getReviews };
