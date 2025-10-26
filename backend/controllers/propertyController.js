const Property = require("../models/propertyModel");
const asyncHandler = require("express-async-handler");

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
const getProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find().populate("owner", "name email role");
  res.json(properties);
});

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate("owner", "name email role");
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }
  res.json(property);
});

// @desc    Create new property (Landlord only)
// @route   POST /api/properties
// @access  Private (Landlord)
const createProperty = asyncHandler(async (req, res) => {
  const { title, description, price, address, city, state, features, images } = req.body;

  const property = await Property.create({
    title,
    description,
    price,
    address,
    city,
    state,
    features,
    images,
    owner: req.user._id,
  });

  res.status(201).json(property);
});

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Landlord)
const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  // Only owner can edit
  if (property.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to edit this property");
  }

  const updated = await Property.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Landlord)
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  if (property.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to delete this property");
  }

  await property.deleteOne();
  res.json({ message: "Property removed successfully" });
});

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
