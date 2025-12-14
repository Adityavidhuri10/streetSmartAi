const express = require("express");
const router = express.Router();
const multer = require("multer");
const { analyzeAgreement } = require("../controllers/agreementController");
const { protect } = require("../middleware/authMiddleware");

// Configure Multer for temporary file storage
const upload = multer({ dest: "uploads/" });

router.post("/analyze", upload.single("agreement"), analyzeAgreement);

module.exports = router;
