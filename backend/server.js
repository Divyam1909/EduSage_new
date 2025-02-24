require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Use the updated User model from models/User.js
const User = require("./models/User");

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

/** ========== RESOURCE SCHEMA (FIXED) ========== **/
const ResourceSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  courseName: { type: String, required: true },
  fileLink: { type: String, required: true },
  bookmarked: { type: Boolean, default: false }, // ✅ FIXED: Added the `bookmarked` field
});

const Resource = mongoose.model("Resource", ResourceSchema);

/** ========== REGISTER USER API ========== **/
app.post("/register", async (req, res) => {
  try {
    // Destructure all fields from the request body
    const { rollno, password, name, branch, sem, dateOfBirth, phone, email } = req.body;
    
    // Basic validation: check if required fields exist
    if (!rollno || !password || !name || !branch || !sem || !dateOfBirth || !phone || !email) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const existingUser = await User.findOne({ rollno });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      rollno,
      password: hashedPassword,
      name,
      branch,
      sem,
      dateOfBirth,
      phone,
      email,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
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
    const token = jwt.sign({ rollno: user.rollno }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== PROFILE API ========== **/
// This endpoint returns the logged-in user's profile (excluding the password)
app.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rollno = decoded.rollno;

    // Exclude the password from the returned user info
    const user = await User.findOne({ rollno }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user);
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
    resource.bookmarked = !resource.bookmarked; // Toggle bookmark status
    const updatedResource = await resource.save();
    res.json(updatedResource);
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

/** ========== START SERVER ========== **/
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
