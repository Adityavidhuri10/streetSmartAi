const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const discussionRoutes = require("./routes/discussionRoutes"); 

// Middleware
const { protect } = require("./middleware/authMiddleware");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/discussions", discussionRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("StreetSmart AI Backend Running...");
});

// Protected test route
app.get("/api/private", protect, (req, res) => {
  res.json({ message: `Welcome ${req.user.name}, role: ${req.user.role}` });
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
