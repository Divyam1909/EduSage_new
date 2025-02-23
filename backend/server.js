require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

/** ========== USER SCHEMA ========== **/
const UserSchema = new mongoose.Schema({
  rollno: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", UserSchema);

/** ========== RESOURCE SCHEMA (FIXED) ========== **/
const ResourceSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  courseName: { type: String, required: true },
  fileLink: { type: String, required: true },
  bookmarked: { type: Boolean, default: false },  // ✅ FIXED: Added the `bookmarked` field
});
const Resource = mongoose.model("Resource", ResourceSchema);

/** ========== EVENT SCHEMA ========== **/
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, default: "" },
  details: { type: String, default: "" },
});
const Event = mongoose.model("Event", EventSchema);

/** ========== REGISTER USER API ========== **/
app.post("/register", async (req, res) => {
  try {
    const { rollno, password } = req.body;
    const existingUser = await User.findOne({ rollno });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ rollno, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== LOGIN USER API ========== **/
app.post("/login", async (req, res) => {
  try {
    const { rollno, password } = req.body;
    const user = await User.findOne({ rollno });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ rollno: user.rollno }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== ADD RESOURCE API ========== **/
app.post("/api/resources", async (req, res) => {
  try {
    const { fileName, courseName, fileLink } = req.body;

    if (!fileName || !courseName || !fileLink) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newResource = new Resource({ fileName, courseName, fileLink });
    await newResource.save();

    res.status(201).json(newResource);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== GET ALL RESOURCES API ========== **/
app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== UPDATE RESOURCE API ========== **/
app.put("/api/resources/:id", async (req, res) => {
  try {
    const { fileName, courseName, fileLink } = req.body;
    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      { fileName, courseName, fileLink },
      { new: true }
    );

    if (!updatedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(updatedResource);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== DELETE RESOURCE API ========== **/
app.delete("/api/resources/:id", async (req, res) => {
  try {
    const deletedResource = await Resource.findByIdAndDelete(req.params.id);

    if (!deletedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== TOGGLE BOOKMARK API (FIXED) ========== **/
app.put("/api/resources/:id/bookmark", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    resource.bookmarked = !resource.bookmarked;  // ✅ Toggle bookmark status
    const updatedResource = await resource.save(); // ✅ Save updated document

    res.json(updatedResource);  // ✅ Return updated resource
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== GET ONLY BOOKMARKED RESOURCES ========== **/
app.get("/api/resources/bookmarked", async (req, res) => {
  try {
    const bookmarkedResources = await Resource.find({ bookmarked: true });
    res.json(bookmarkedResources);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== GET ALL EVENTS API ========== **/
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== ADD NEW EVENT API ========== **/
app.post("/api/events", async (req, res) => {
  try {
    const { title, date, time, details } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: "Title and Date are required" });
    }
    const newEvent = new Event({ title, date, time, details });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update Event
app.put("/api/events/:id", async (req, res) => {
  try {
    const { title, date, time, details } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, date, time, details },
      { new: true }
    );
    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* START SERVER */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
