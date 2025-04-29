const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken } = require('../middleware/auth');

// Create a new event
router.post("/", authenticateToken, async (req, res) => {
  try {
    console.log("POST /api/events - Request payload:", {
      body: req.body,
      user: req.user
    });
    
    const { title, date, time, details, notifications } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }
    
    // Create a new event with notification settings and userId
    const newEvent = new Event({ 
      title, 
      date, 
      time, 
      details,
      userId: req.user.rollno, // Use rollno from JWT token instead of id
      notifications: notifications || {
        dayBefore: true,
        dayOf: true,
        atTime: time ? true : false
      },
      notificationStatus: {
        dayBeforeSent: false,
        dayOfSent: false,
        atTimeSent: false
      }
    });
    
    console.log("Creating new event:", newEvent);
    
    await newEvent.save();
    console.log("Event saved successfully:", newEvent._id);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all events for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Only retrieve events for the authenticated user
    const events = await Event.find({ userId: req.user.rollno }).lean();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update an event
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { title, date, time, details, notifications } = req.body;
    
    // First check if event belongs to user
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if event belongs to the authenticated user
    if (event.userId !== req.user.rollno) {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }
    
    // Update event with notification settings
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        date, 
        time, 
        details,
        notifications: notifications || {
          dayBefore: true,
          dayOf: true,
          atTime: time ? true : false
        }
      },
      { new: true }
    );
    
    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete an event
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    // First check if event belongs to user
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if event belongs to the authenticated user
    if (event.userId !== req.user.rollno) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }
    
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; 