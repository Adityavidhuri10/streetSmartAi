const express = require("express");
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  createFakeProperty,
} = require("../controllers/propertyController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/")
  .get(getProperties)
  .post(protect, authorizeRoles("landlord"), createProperty);

router.get("/myproperties", protect, getMyProperties);
router.post("/fake", protect, createFakeProperty);

router.route("/:id")
  .get(getPropertyById)
  .put(protect, authorizeRoles("landlord"), updateProperty)
  .delete(protect, authorizeRoles("landlord"), deleteProperty);

module.exports = router;
