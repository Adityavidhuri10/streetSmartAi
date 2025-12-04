import Property from "../models/propertyModel.js";
import asyncHandler from "express-async-handler";


export const getProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find().populate("owner", "name email role");
  res.json(properties);
});


export const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate(
    "owner",
    "name email role"
  );

  if (!property) {
    return res.status(404).json({ error: "Property not found" });
  }

  res.json(property);
});


const parseFeatures = (input) => {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.map((f) => f.trim());
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }

  return [];
};

export const createProperty = asyncHandler(async (req, res) => {
  try {
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);

    const featuresArray = parseFeatures(req.body.features);

    const imageUrls = req.files?.length
      ? req.files.map((file) => file.path) // Cloudinary auto returns secure_url in file.path
      : [];

    const property = await Property.create({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      features: featuresArray,
      images: imageUrls,
      safety_score: Math.floor(Math.random() * 10) + 1,
      owner: req.user._id,
    });

    res.status(201).json(property);
  } catch (error) {
    console.error(" Error creating property:", error);
    res.status(500).json({ error: "Failed to create property" });
  }
});


export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ error: "Property not found" });
  }

  // Only owner can edit
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const newFeatures = parseFeatures(req.body.features);

  // new uploaded images
  const newImages = req.files?.length
    ? req.files.map((file) => file.path)
    : [];

  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      features: newFeatures.length ? newFeatures : property.features,
      images: [...property.images, ...newImages], // merge old + new images
    },
    { new: true }
  );

  res.json(updatedProperty);
});


export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ error: "Property not found" });
  }

  // Only owner can delete
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Not authorized" });
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
