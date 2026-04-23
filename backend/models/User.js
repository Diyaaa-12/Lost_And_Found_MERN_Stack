const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,        // MongoDB unique index → prevents duplicate emails
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      // Always stored as bcrypt hash — never plain text
    },
  },
  { timestamps: true }     // auto createdAt + updatedAt
);

module.exports = mongoose.model("User", userSchema);
// Collection in MongoDB will be called "users"