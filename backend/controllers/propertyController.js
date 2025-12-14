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
  const { title, description, price, address, city, state, features, images, safety_score } = req.body;

  const property = await Property.create({
    title,
    description,
    price,
    address,
    city,
    state,
    features,
    images,
    safety_score,
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

// @desc    Get logged in user's properties
// @route   GET /api/properties/myproperties
// @access  Private
const getMyProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ owner: req.user.id });
  res.json(properties);
});

// @desc    Create a fake property listing
// @route   POST /api/properties/fake
// @access  Private
const createFakeProperty = asyncHandler(async (req, res) => {
  // 1. Get all properties with images
  const allProperties = await Property.find({ images: { $exists: true, $not: { $size: 0 } } });

  let allImages = [];
  allProperties.forEach(p => {
    if (p.images && p.images.length > 0) {
      allImages = [...allImages, ...p.images];
    }
  });

  if (allImages.length === 0) {
    res.status(400);
    throw new Error("No images found in database to create fake listing");
  }

  // 2. Pick 3-5 random images
  const numImages = Math.floor(Math.random() * 3) + 3; // 3 to 5
  const selectedImages = [];
  for (let i = 0; i < numImages; i++) {
    const randomImage = allImages[Math.floor(Math.random() * allImages.length)];
    selectedImages.push(randomImage);
  }

  // 3. Generate fake data
  const titles = ["Beautiful Apartment", "Cozy Studio", "Spacious Villa", "Modern Condo", "Luxury Penthouse"];
  const cities = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai"];
  const featuresList = ["WiFi", "Parking", "Gym", "Pool", "Security", "Balcony"];

  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const randomPrice = Math.floor(Math.random() * 50000) + 10000;

  // Random features
  const randomFeatures = featuresList.filter(() => Math.random() > 0.5);

  const property = await Property.create({
    title: `${randomTitle} in ${randomCity}`,
    description: "This is a randomly generated property listing for demonstration purposes. It features modern amenities and a great location.",
    price: randomPrice,
    address: `${Math.floor(Math.random() * 100)} Main St, ${randomCity}`,
    city: randomCity,
    state: "India",
    country: "India",
    features: randomFeatures,
    images: selectedImages,
    owner: req.user._id,
    isScraped: false,
    bhk: `${Math.floor(Math.random() * 3) + 1} BHK`,
    area: `${Math.floor(Math.random() * 1000) + 500} sqft`
  });

  res.status(201).json(property);
});

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  createFakeProperty,
};
