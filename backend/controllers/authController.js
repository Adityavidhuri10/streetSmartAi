const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// 🔐 Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 🧩 REGISTER USER
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate input
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  // Respond with user info + token
  res.status(201).json({
    user: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      savedProperties: user.savedProperties,
    },
    token: generateToken(user.id, user.role),
  });
});

// 🧩 LOGIN USER
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Validate password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Respond with user info + token
  res.status(200).json({
    user: {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      savedProperties: user.savedProperties,
    },
    token: generateToken(user.id, user.role),
  });
});

// 👤 GET CURRENT USER PROFILE
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    savedProperties: user.savedProperties,
  });
});

// 💾 TOGGLE SAVED PROPERTY
// @route   PUT /api/auth/save/:id
// @access  Private (Tenant only)
const toggleSavedProperty = asyncHandler(async (req, res) => {
  const propertyId = req.params.id;
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isSaved = user.savedProperties.includes(propertyId);

  if (isSaved) {
    user.savedProperties = user.savedProperties.filter(
      (id) => id.toString() !== propertyId
    );
    await user.save();
    res.status(200).json({ message: "Property removed from saved list", savedProperties: user.savedProperties });
  } else {
    user.savedProperties.push(propertyId);
    await user.save();
    res.status(200).json({ message: "Property saved successfully", savedProperties: user.savedProperties });
  }
});

// 📂 GET SAVED PROPERTIES
// @route   GET /api/auth/saved
// @access  Private (Tenant only)
const getSavedProperties = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("savedProperties");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user.savedProperties);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  toggleSavedProperty,
  getSavedProperties,
};
