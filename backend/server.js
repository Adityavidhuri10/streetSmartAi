import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Routes (ES Modules)
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import discussionRoutes from "./routes/discussionRoutes.js"; 
import { protect } from "./middleware/authMiddleware.js";

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/discussions", discussionRoutes);

app.get("/", (req, res) => {
  res.send("StreetSmart AI Backend Running...");
});

app.get("/api/private", protect, (req, res) => {
  res.json({ message: `Welcome ${req.user.name}, role: ${req.user.role}` });
});

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
