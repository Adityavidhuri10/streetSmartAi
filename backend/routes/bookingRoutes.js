const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { createBooking, getMyBookings, cancelBooking, getLandlordBookings } = require("../controllers/bookingController");

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/landlord", protect, getLandlordBookings);
router.delete("/:id", protect, cancelBooking);

module.exports = router;
