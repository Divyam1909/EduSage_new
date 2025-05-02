const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");
const User = require("../models/User");
const SubjectMark = require("../models/SubjectMark");
const QuizAttempt = require("../models/QuizAttempt");
const { authenticateToken } = require("../middleware/auth");
const multer = require("multer");
const uploadHandler = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
require("dotenv").config();

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  const { name, teacherId, dateOfBirth, dateOfJoining, phone, email, password } = req.body;

  try {
    let teacher = await Teacher.findOne({ teacherId });
    if (teacher) return res.status(400).json({ message: "Teacher already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    teacher = new Teacher({
      name,
      teacherId,
      dateOfBirth,
      dateOfJoining,
      phone,
      email,
      password: hashedPassword
    });
    await teacher.save();

    res.status(201).json({ message: "Teacher registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { teacherId, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ teacherId });
    if (!teacher) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: teacher._id, role: "teacher" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, teacher: { id: teacher._id, teacherId: teacher.teacherId, name: teacher.name } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Forgot Password (placeholder)
router.post("/forgot", async (req, res) => {
  const { teacherId, email } = req.body;
  // In production, send email with reset link/token
  res.json({ message: "If the teacher exists, a password reset link will be sent to the registered email." });
});

// Middleware to check if user is a teacher (for future use)
function authenticateTeacher(req, res, next) {
  authenticateToken(req, res, next);
}

// Get all students with details
router.get("/students", authenticateTeacher, async (req, res) => {
  try {
    const students = await User.find().select("-password -profileImage");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get a student's marks
router.get("/students/:rollno/marks", authenticateTeacher, async (req, res) => {
  try {
    const marks = await SubjectMark.find({ user: req.params.rollno });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add a mark for a student
router.post("/students/:rollno/marks", authenticateTeacher, async (req, res) => {
  try {
    const { subject, cia1, cia2, midSem, endSem } = req.body;
    const newMark = new SubjectMark({
      user: req.params.rollno,
      subject,
      cia1,
      cia2,
      midSem,
      endSem,
    });
    await newMark.save();
    res.status(201).json(newMark);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Edit a student's mark
router.put("/students/:rollno/marks/:id", authenticateTeacher, async (req, res) => {
  try {
    const { subject, cia1, cia2, midSem, endSem } = req.body;
    const updatedMark = await SubjectMark.findOneAndUpdate(
      { _id: req.params.id, user: req.params.rollno },
      { subject, cia1, cia2, midSem, endSem },
      { new: true }
    );
    if (!updatedMark) return res.status(404).json({ message: "Record not found" });
    res.json(updatedMark);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a student's mark
router.delete("/students/:rollno/marks/:id", authenticateTeacher, async (req, res) => {
  try {
    const deleted = await SubjectMark.findOneAndDelete({ _id: req.params.id, user: req.params.rollno });
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get a student's quiz attempts
router.get("/students/:rollno/quizAttempts", authenticateTeacher, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.params.rollno }).populate("quizId").lean();
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get class leaderboard (by wisdom points)
router.get("/class/leaderboard", authenticateTeacher, async (req, res) => {
  try {
    const students = await User.find().sort({ wisdomPoints: -1 }).select("name rollno wisdomPoints");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get class graph data (average marks per subject)
router.get("/class/graph", authenticateTeacher, async (req, res) => {
  try {
    const marks = await SubjectMark.aggregate([
      { $group: { _id: "$subject", avgMarks: { $avg: { $add: ["$cia1", "$cia2", "$midSem", "$endSem"] } } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get teacher profile
router.get("/profile", authenticateTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const teacher = await Teacher.findById(teacherId).select("-password -profileImage");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update teacher profile
router.put("/profile", authenticateTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { name, dateOfBirth, dateOfJoining, phone, email } = req.body;
    if (!name || !dateOfBirth || !dateOfJoining || !phone || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const updateData = {
      name,
      dateOfBirth: new Date(dateOfBirth),
      dateOfJoining: new Date(dateOfJoining),
      phone,
      email
    };
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -profileImage");
    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ message: "Profile updated successfully", teacher: updatedTeacher });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update teacher profile photo
router.post("/profile/photo", authenticateTeacher, uploadHandler.single("photo"), async (req, res) => {
  try {
    const teacherId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const updateData = {
      profileImage: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    };
    const base64Image = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
    updateData.photoUrl = dataURI;
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true }
    );
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ photoUrl: dataURI });
  } catch (err) {
    res.status(500).json({ message: "Server error uploading photo" });
  }
});

module.exports = router; 