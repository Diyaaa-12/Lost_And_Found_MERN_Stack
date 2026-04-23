const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const authRoutes  = require("./routes/auth");
const itemRoutes  = require("./routes/items");

const app = express();

// ── Global Middleware ─────────────────────────────────────────────
// Every incoming request passes through these first

app.use(cors({
  origin: "*",               // Allow all origins (in production: your frontend URL)
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(express.json());     // Parse JSON bodies → populates req.body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ── Routes ────────────────────────────────────────────────────────
app.use("/api", authRoutes);   // /api/register, /api/login
app.use("/api", itemRoutes);   // /api/items, /api/items/:id, etc.

// Root health check — useful for Render deployment verification
app.get("/", (req, res) => {
  res.json({
    message: "🔍 Lost & Found API is running ✅",
    version: "1.0.0",
    endpoints: {
      auth:  ["POST /api/register", "POST /api/login"],
      items: [
        "POST /api/items",
        "GET /api/items",
        "GET /api/items/search?name=xyz",
        "GET /api/items/:id",
        "PUT /api/items/:id",
        "DELETE /api/items/:id",
      ],
    },
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Connect to MongoDB and Start Server ───────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });