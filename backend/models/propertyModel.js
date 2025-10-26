const mongoose = require("mongoose");

const propertySchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a property title"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    city: {
      type: String,
      required: [true, "Please specify city"],
    },
    state: {
      type: String,
      required: [true, "Please specify state"],
    },
    country: {
      type: String,
      default: "India",
    },
    features: {
      type: [String], // like ["WiFi", "Parking", "Security"]
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    safety_score: {
      type: Number,
      default: null, // fetched later from safety AI
    },
    avgRating: {
    type: Number,
    default: 0,
},

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Property", propertySchema);
