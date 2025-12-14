const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "rejected"],
            default: "pending",
        },
        proofImage: {
            type: [String], // Array of URLs to the uploaded images
        },
        defectAnalysis: {
            type: mongoose.Schema.Types.Mixed, // Allow flexible structure for aggregated results
        },
        agreementAnalysis: {
            type: mongoose.Schema.Types.Mixed, // Allow flexible structure
        },
        bookingDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Booking", bookingSchema);
