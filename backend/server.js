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
  name: { type: String, required: true },
  rollno: { type: String, unique: true, required: true },
  branch: { type: String, required: true },
  sem: { type: Number, required: true },
  dateOfBirth: { type: Date, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

/** ========== RESOURCE SCHEMA ========== **/
const ResourceSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  courseName: { type: String, required: true },
  fileLink: { type: String, required: true },
  bookmarked: { type: Boolean, default: false },
});

const Resource = mongoose.model("Resource", ResourceSchema);

/** ========== EVENT SCHEMA ========== **/
// Note: Make sure your file is named event.js and is in the /models folder.
const Event = require("./models/Event.js");

/** ========== QUESTION MODEL ========== **/
const Question = require("./models/question.js");

/** ========== REGISTER USER API ========== **/
app.post("/register", async (req, res) => {
  try {
    const { name, rollno, branch, sem, dateOfBirth, phone, email, password } =
      req.body;
    const existingUser = await User.findOne({ rollno });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      rollno,
      branch,
      sem,
      dateOfBirth,
      phone,
      email,
      password: hashedPassword,
    });
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

/** ========== RESOURCE APIs ========== **/
// Add Resource
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

// Get All Resources
app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update Resource
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

// Delete Resource
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

// Toggle Bookmark
app.put("/api/resources/:id/bookmark", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource)
      return res.status(404).json({ message: "Resource not found" });

    resource.bookmarked = !resource.bookmarked;
    const updatedResource = await resource.save();

    res.json(updatedResource);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get Only Bookmarked Resources
app.get("/api/resources/bookmarked", async (req, res) => {
  try {
    const bookmarkedResources = await Resource.find({ bookmarked: true });
    res.json(bookmarkedResources);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== EVENT APIs ========== **/
// Create Event
app.post("/api/events", async (req, res) => {
  try {
    const { title, date, time, details } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }
    const newEvent = new Event({ title, date, time, details });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
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
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== QUESTION APIs ========== **/
// Create a New Question
app.post("/api/questions", async (req, res) => {
  try {
    const { title, details, subject, wisdomPoints } = req.body;
    if (!title || !subject) {
      return res
        .status(400)
        .json({ message: "Title and subject are required" });
    }
    const newQuestion = new Question({
      title,
      details,
      subject,
      wisdomPoints,
    });
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Questions (sorted by newest first)
app.get("/api/questions", async (req, res) => {
  try {
    const questions = await Question.find().sort({ askedAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// New Endpoint: Share Wisdom (Add wisdom points to a question)
app.put("/api/questions/:id/wisdom", async (req, res) => {
  try {
    const { wisdomPoints } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    // Add the given wisdom points to the existing value
    question.wisdomPoints += wisdomPoints;
    await question.save();
    res.json(question);
  } catch (error) {
    console.error("Error sharing wisdom", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
}

// Profile API Route
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { rollno } = req.user;
    // Fetch the user from the database using the roll number from the token.
    // Exclude the password field for security.
    const user = await User.findOne({ rollno }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile", error);
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== START SERVER ========== **/
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
