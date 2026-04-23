const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",                   // references User collection
      required: true,
    },
    // Store owner's name for display without needing to join User
    userName: {
      type: String,
      required: true,
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: ["Lost", "Found"],       // only these two values allowed
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    contactInfo: {
      type: String,
      required: [true, "Contact info is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Resolved"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// Text index for search functionality
// Allows $text search across itemName and description fields
itemSchema.index({ itemName: "text", description: "text", location: "text" });

module.exports = mongoose.model("Item", itemSchema);