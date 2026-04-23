const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");

// ═══════════════════════════════════════════
// POST /api/register
// PURPOSE: Create new user account
// FLOW: Validate → Check duplicate → Hash password → Save → Return success
// ═══════════════════════════════════════════
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate all required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are all required",
      });
    }

    // 2. Check minimum password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // 3. Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered. Please login.",
      });
      // 409 Conflict = duplicate resource
    }

    // 4. Hash the password
    // bcrypt.hash(plain, saltRounds)
    // saltRounds=10 → 2^10=1024 iterations → brute-force resistant
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create and save user document
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,  // NEVER the plain password
    });

    // 6. Return success — never include password in response
    res.status(201).json({
      success: true,
      message: "Account created successfully! Please login.",
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ═══════════════════════════════════════════
// POST /api/login
// PURPOSE: Authenticate user and return JWT token
// FLOW: Find user → Compare password → Sign JWT → Return token
// ═══════════════════════════════════════════
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 1. Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });

    // SECURITY: Use identical error message for wrong email AND wrong password
    // → attacker cannot tell which one was wrong (prevents user enumeration)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 2. Compare plain input with stored bcrypt hash
    // bcrypt.compare re-hashes the input and compares — cannot reverse hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Generate JWT token
    // Payload = data baked into the token (not sensitive data)
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }          // token valid for 7 days
    );

    // 4. Return token + user info to frontend
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;