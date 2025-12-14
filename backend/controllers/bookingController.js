const asyncHandler = require("express-async-handler");
const Booking = require("../models/bookingModel");
const Property = require("../models/propertyModel");

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
    const { propertyId, proofImage, defectAnalysis, agreementAnalysis } = req.body;

    const property = await Property.findById(propertyId);

    if (!property) {
        res.status(404);
        throw new Error("Property not found");
    }

    // DEMO LOGIC: If property has no owner (e.g. scraped), assign it to Demo Landlord
    // so the user can see the booking in the Demo Landlord dashboard.
    if (!property.owner) {
        const User = require("../models/userModel");
        const demoLandlord = await User.findOne({ email: "landlord@demo.com" });
        if (demoLandlord) {
            property.owner = demoLandlord._id;
            await property.save();
        }
    }

    const booking = await Booking.create({
        user: req.user._id,
        property: propertyId,
        proofImage,
        defectAnalysis,
        agreementAnalysis,
        status: "confirmed", // Auto-confirm for now
    });

    // Update property status
    property.status = "booked";
    await property.save();

    // Create Notification for Landlord ONLY if owner exists
    if (property.owner) {
        const Notification = require("../models/notificationModel");
        await Notification.create({
            recipient: property.owner,
            sender: req.user._id,
            type: "booking_created",
            message: `New booking request for ${property.title} by ${req.user.name}`,
            relatedId: booking._id,
            onModel: "Booking",
        });
    }

    res.status(201).json(booking);
});

// @desc    Get logged in user bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("property")
        .sort({ createdAt: -1 });
    res.json(bookings);
});

// @desc    Cancel a booking
// @route   DELETE /api/bookings/:id
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error("Booking not found");
    }

    // Ensure user owns the booking
    if (booking.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error("Not authorized");
    }

    // Update property status back to available
    const property = await Property.findById(booking.property);
    if (property) {
        property.status = "available";
        await property.save();
    }

    await booking.deleteOne();

    res.json({ message: "Booking cancelled" });
});

// @desc    Get bookings for properties owned by the logged-in landlord
// @route   GET /api/bookings/landlord
// @access  Private (Landlord)
const getLandlordBookings = asyncHandler(async (req, res) => {
    // Find properties owned by the user
    const properties = await Property.find({ owner: req.user._id });
    const propertyIds = properties.map(p => p._id);

    // Find bookings for these properties
    const bookings = await Booking.find({ property: { $in: propertyIds } })
        .populate("property")
        .populate("user", "name email") // Populate tenant details
        .sort({ createdAt: -1 });

    res.json(bookings);
});

module.exports = {
    createBooking,
    getMyBookings,
    cancelBooking,
    getLandlordBookings,
};
