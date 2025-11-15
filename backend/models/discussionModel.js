const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    likes: { type: Number, default: 0 },
    replies: [this], // recursive
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const discussionSchema = new mongoose.Schema(
  {
    propertyTitle: { type: String, required: true },
    locality: { type: String, required: true },
    rating: { type: Number, required: true },
    text: { type: String, required: true },

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    likes: { type: Number, default: 0 },

    replies: [replySchema], 

    verifiedTenant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discussion", discussionSchema);

