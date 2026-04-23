const express = require("express");
const router  = express.Router();
const Item    = require("../models/Item");
const protect = require("../middleware/authMiddleware");

// ═══════════════════════════════════════════
// POST /api/items  [PROTECTED]
// PURPOSE: Report a new lost or found item
// ═══════════════════════════════════════════
router.post("/items", protect, async (req, res) => {
  try {
    const { itemName, description, type, location, date, contactInfo } = req.body;

    // Validate required fields
    if (!itemName || !description || !type || !location || !date || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate type value
    if (!["Lost", "Found"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'Lost' or 'Found'",
      });
    }

    // userId and userName from JWT — NOT from req.body (security!)
    const item = await Item.create({
      userId:      req.user.id,
      userName:    req.user.name,
      itemName,
      description,
      type,
      location,
      date:        new Date(date),
      contactInfo,
    });

    res.status(201).json({
      success: true,
      message: `${type} item reported successfully`,
      item,
    });
  } catch (err) {
    console.error("Add item error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ═══════════════════════════════════════════
// GET /api/items  [PROTECTED]
// PURPOSE: Get ALL items (public board — everyone can see all)
// BONUS: filter by type ?type=Lost or ?type=Found
// ═══════════════════════════════════════════
router.get("/items", protect, async (req, res) => {
  try {
    const filter = {};

    // Optional: filter by type → GET /api/items?type=Lost
    if (req.query.type && ["Lost", "Found"].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    // Optional: filter by status → GET /api/items?status=Active
    if (req.query.status && ["Active", "Resolved"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    // Sort by newest first (-1 = descending)
    const items = await Item.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ═══════════════════════════════════════════
// GET /api/items/search?name=xyz  [PROTECTED]
// PURPOSE: Search items by name, description, or location
// IMPORTANT: This route must come BEFORE /api/items/:id
// because Express reads routes top-to-bottom and "search"
// would otherwise be treated as an :id parameter
// ═══════════════════════════════════════════
router.get("/items/search", protect, async (req, res) => {
  try {
    const { name, type } = req.query;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query 'name' is required",
      });
    }

    // Build filter using regex for partial, case-insensitive matching
    // RegExp with 'i' flag = case-insensitive
    // This searches itemName, description, and location
    const searchRegex = new RegExp(name.trim(), "i");

    const filter = {
      $or: [
        { itemName:    { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { location:    { $regex: searchRegex } },
      ],
    };

    // Optional type filter combined with search
    if (type && ["Lost", "Found"].includes(type)) {
      filter.type = type;
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      query: name,
      count: items.length,
      items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ═══════════════════════════════════════════
// GET /api/items/:id  [PROTECTED]
// PURPOSE: Get one specific item by its MongoDB _id
// ═══════════════════════════════════════════
router.get("/items/:id", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({ success: true, item });
  } catch (err) {
    // Invalid MongoDB ObjectId format
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid item ID format" });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ═══════════════════════════════════════════
// PUT /api/items/:id  [PROTECTED]
// PURPOSE: Update an item (only the owner can update)
// ═══════════════════════════════════════════
router.put("/items/:id", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // AUTHORIZATION CHECK: only the owner can update
    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden — you can only update your own items",
        // 403 = Forbidden (authenticated BUT not authorized)
      });
    }

    const { itemName, description, type, location, date, contactInfo, status } = req.body;

    // Only update fields that were provided
    if (itemName)    item.itemName    = itemName;
    if (description) item.description = description;
    if (type && ["Lost","Found"].includes(type)) item.type = type;
    if (location)    item.location    = location;
    if (date)        item.date        = new Date(date);
    if (contactInfo) item.contactInfo = contactInfo;
    if (status && ["Active","Resolved"].includes(status)) item.status = status;

    const updatedItem = await item.save();

    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      item: updatedItem,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ═══════════════════════════════════════════
// DELETE /api/items/:id  [PROTECTED]
// PURPOSE: Delete an item (only the owner can delete)
// ═══════════════════════════════════════════
router.delete("/items/:id", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // AUTHORIZATION: only the item owner can delete it
    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden — you can only delete your own items",
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;