require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

/** ========== MODELS ========== **/
// User Model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollno: { type: String, unique: true, required: true },
  branch: { type: String, required: true },
  sem: { type: Number, required: true },
  dateOfBirth: { type: Date, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  realPassword: { type: String, required: true },
  wisdomPoints: { type: Number, default: 0 },
  experience: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  questionsAnswered: { type: Number, default: 0 },
  quizzesAttempted: { type: Number, default: 0 },
  photoUrl: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  },
});
const User = mongoose.model("User", UserSchema);

// Resource Model
const ResourceSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  courseName: { type: String, required: true },
  fileLink: { type: String, required: true },
  bookmarked: { type: Boolean, default: false },
});
const Resource = mongoose.model("Resource", ResourceSchema);

// Event Model – stored in ./models/Event.js
const Event = require("./models/Event.js");

// Question Model – stored in ./models/question.js
const Question = require("./models/question.js");

// Answer Model
const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  user: { type: String, required: true },
  content: { type: String, required: true },
  answeredAt: { type: Date, default: Date.now },
  attachments: { type: Array, default: [] },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
});
const Answer = mongoose.model("Answer", AnswerSchema);

// SubjectMark Model – stored in ./models/SubjectMark.js
const SubjectMarkSchema = new mongoose.Schema({
  user: { type: String, required: true },
  subject: { type: String, required: true },
  cia1: { type: Number, required: true },
  cia2: { type: Number, required: true },
  midSem: { type: Number, required: true },
  endSem: { type: Number, required: true },
});
const SubjectMark = mongoose.model("SubjectMark", SubjectMarkSchema);

// Quiz Model – stored in ./models/Quiz.js
const Quiz = require("./models/Quiz.js");
// QuizAttempt Model – stored in ./models/QuizAttempt.js
const QuizAttempt = require("./models/QuizAttempt.js");

/** ========== REGISTER USER API ========== **/
app.post("/register", async (req, res) => {
  try {
    const { name, rollno, branch, sem, dateOfBirth, phone, email, password } = req.body;
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
      realPassword: password,
      wisdomPoints: 0,
      experience: 0,
      rank: 0,
      questionsAnswered: 0,
      quizzesAttempted: 0,
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

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

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

/** ========== NEW ENDPOINT: Upload Academic Calendar PDF ========== **/
const uploadHandler = multer();
const { extractEventsFromPDF } = require("./pdfParser");

app.post("/api/calendar/upload", uploadHandler.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const events = await extractEventsFromPDF(req.file.buffer);
    if (events.length > 0) {
      await Event.insertMany(events);
      res.status(200).json({ message: "Events uploaded successfully", events });
    } else {
      res.status(400).json({ message: "No events found in the uploaded file" });
    }
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ message: "Server error processing PDF" });
  }
});

/** ========== QUESTION APIs ========== **/
app.post("/api/questions", async (req, res) => {
  try {
    const { title, details, subject, wisdomPoints } = req.body;
    if (!title || !subject) {
      return res.status(400).json({ message: "Title and subject are required" });
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

app.get("/api/questions", async (req, res) => {
  try {
    const questions = await Question.find().sort({ askedAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Increment wisdom points on a question
app.put("/api/questions/:id/wisdom", async (req, res) => {
  try {
    const { wisdomPoints } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    question.wisdomPoints += wisdomPoints;
    await question.save();
    res.json(question);
  } catch (error) {
    console.error("Error sharing wisdom", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get answers for a question
app.get("/api/questions/:id/answers", async (req, res) => {
  try {
    const answers = await Answer.find({ questionId: req.params.id }).sort({ answeredAt: -1 });
    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Post an answer for a question
app.post("/api/questions/:id/answers", async (req, res) => {
  try {
    const { user, content, attachments } = req.body;
    if (!user || !content) {
      return res.status(400).json({ message: "User and content are required" });
    }
    const newAnswer = new Answer({
      questionId: req.params.id,
      user,
      content,
      attachments,
    });
    await newAnswer.save();
    await Question.findByIdAndUpdate(req.params.id, { $inc: { answers: 1 } });
    res.status(201).json(newAnswer);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update an answer
app.put("/api/answers/:id", async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    if (answer.user !== "You") {
      return res.status(403).json({ message: "Not authorized" });
    }
    answer.content = content;
    answer.attachments = attachments;
    await answer.save();
    res.json(answer);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an answer
app.delete("/api/answers/:id", async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    if (answer.user !== "You") {
      return res.status(403).json({ message: "Not authorized" });
    }
    await answer.deleteOne();
    await Question.findByIdAndUpdate(answer.questionId, { $inc: { answers: -1 } });
    res.json({ message: "Answer deleted successfully" });
  } catch (error) {
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

// Get user profile
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { rollno } = req.user;
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

/** ========== NEW ENDPOINT: Update Profile Photo ========== **/
app.post("/api/profile/photo", authenticateToken, uploadHandler.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    const filename = Date.now() + "-" + req.file.originalname;
    const filePath = path.join(uploadPath, filename);
    fs.writeFileSync(filePath, req.file.buffer);
    const PORT = process.env.PORT || 5000;
    const photoUrl = `http://localhost:${PORT}/uploads/${filename}`;
    await User.findOneAndUpdate({ rollno: req.user.rollno }, { photoUrl }, { new: true });
    res.json({ photoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error uploading photo" });
  }
});

/** ========== TOP SAGES API (Updated) ========== **/
// Compute top sages by aggregating subject marks and joining with User info.
app.get("/api/top-sages", async (req, res) => {
  try {
    const topSages = await SubjectMark.aggregate([
      {
        $group: {
          _id: "$user",
          totalMarks: { $sum: { $add: ["$cia1", "$cia2", "$midSem", "$endSem"] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "rollno",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          rollno: "$userInfo.rollno",
          name: "$userInfo.name",
          photoUrl: "$userInfo.photoUrl",
          wisdomPoints: "$totalMarks",
          rank: "$userInfo.rank",
        },
      },
      { $sort: { wisdomPoints: -1 } },
      { $limit: 3 },
    ]);
    res.json(topSages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// NEW ENDPOINT: Class Results
app.get("/api/classResults", async (req, res) => {
  try {
    const results = await SubjectMark.aggregate([
      {
        $group: {
          _id: "$user",
          totalMarks: { $sum: { $add: ["$cia1", "$cia2", "$midSem", "$endSem"] } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          overall: { $multiply: [{ $divide: ["$totalMarks", { $multiply: ["$count", 120] }] }, 100] },
        },
      },
      { $sort: { overall: -1 } },
    ]);
    const totalStudents = results.length;
    const classAverageResult = results.reduce((acc, curr) => acc + curr.overall, 0) / (totalStudents || 1);
    res.json({ classAverageResult, results, totalStudents });
  } catch (error) {
    console.error("Error computing class results:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== QUIZ APIs ========== **/
// Create a new Quiz
app.post("/api/quizzes", async (req, res) => {
  try {
    const { title, topic, difficulty, timeLimit, points, questions, clearable } = req.body;
    if (
      !title ||
      !topic ||
      !difficulty ||
      timeLimit <= 0 ||
      points <= 0 ||
      !questions ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({ message: "All quiz fields are required and must be valid" });
    }
    const newQuiz = new Quiz({ title, topic, difficulty, timeLimit, points, questions, clearable });
    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all Quizzes
app.get("/api/quizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific Quiz by ID
app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a Quiz
app.delete("/api/quizzes/:id", async (req, res) => {
  try {
    const deletedQuiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!deletedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Submit a Quiz Attempt
app.post("/api/quizzes/:id/attempt", async (req, res) => {
  try {
    console.log("Received quiz attempt submission for quiz ID:", req.params.id);
    const { user, answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      console.error("Quiz not found for ID:", req.params.id);
      return res.status(404).json({ message: "Quiz not found" });
    }
    let totalScore = 0;
    const processedAnswers = quiz.questions.map((q, index) => {
      const userAnswerObj = answers.find((ans) => ans.questionId === index);
      const userAnswer = userAnswerObj ? userAnswerObj.answer : "";
      const isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      const marksObtained = isCorrect ? (q.marks || 0) : 0;
      totalScore += marksObtained;
      return { questionId: index, answer: userAnswer, correct: isCorrect, marksObtained };
    });
    const newAttempt = new QuizAttempt({
      quizId: quiz._id,
      user,
      answers: processedAnswers,
      totalScore,
      timeTaken,
      clearable: quiz.clearable,
    });
    await newAttempt.save();
    console.log("Quiz attempt saved with total score:", totalScore);
    // Update user's quizzesAttempted and wisdomPoints
    await User.findOneAndUpdate({ rollno: user }, { $inc: { quizzesAttempted: 1, wisdomPoints: totalScore } });
    res.status(201).json({ attempt: newAttempt, totalScore });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get quiz attempts for a user
app.get("/api/quizAttempts", async (req, res) => {
  try {
    const user = req.query.user;
    if (!user) return res.status(400).json({ message: "User required" });
    const attempts = await QuizAttempt.find({ user }).populate("quizId");
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE all clearable quiz attempts for a user
app.delete("/api/quizAttempts/clearAll", async (req, res) => {
  try {
    console.log("Clear all attempts requested for user:", req.query.user);
    const user = req.query.user;
    if (!user) return res.status(400).json({ message: "User required" });
    await QuizAttempt.deleteMany({ user, clearable: true });
    console.log("All clearable attempts cleared for user:", user);
    res.json({ message: "All clearable attempts cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a single quiz attempt by ID
app.delete("/api/quizAttempts/:id", async (req, res) => {
  try {
    const attempt = await QuizAttempt.findByIdAndDelete(req.params.id);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    res.json({ message: "Attempt cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== SUBJECT MARKS & STATS APIs ========== **/
// Get subject marks for the logged-in user
app.get("/api/user/stats/subject", authenticateToken, async (req, res) => {
  try {
    const marks = await SubjectMark.find({ user: req.user.rollno });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new subject mark record
app.post("/api/user/stats/subject", authenticateToken, async (req, res) => {
  try {
    const { subject, cia1, cia2, midSem, endSem } = req.body;
    const newMark = new SubjectMark({
      user: req.user.rollno,
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

// Update subject mark record
app.put("/api/user/stats/subject/:id", authenticateToken, async (req, res) => {
  try {
    const { subject, cia1, cia2, midSem, endSem } = req.body;
    const updatedMark = await SubjectMark.findOneAndUpdate(
      { _id: req.params.id, user: req.user.rollno },
      { subject, cia1, cia2, midSem, endSem },
      { new: true }
    );
    if (!updatedMark) return res.status(404).json({ message: "Record not found" });
    res.json(updatedMark);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete subject mark record
app.delete("/api/user/stats/subject/:id", authenticateToken, async (req, res) => {
  try {
    const deleted = await SubjectMark.findOneAndDelete({ _id: req.params.id, user: req.user.rollno });
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== TOP SAGES API (Updated) ========== **/
// Compute top sages by aggregating subject marks and joining with User info.
app.get("/api/top-sages", async (req, res) => {
  try {
    const topSages = await SubjectMark.aggregate([
      {
        $group: {
          _id: "$user",
          totalMarks: { $sum: { $add: ["$cia1", "$cia2", "$midSem", "$endSem"] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "rollno",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          rollno: "$userInfo.rollno",
          name: "$userInfo.name",
          photoUrl: "$userInfo.photoUrl",
          wisdomPoints: "$totalMarks",
          rank: "$userInfo.rank",
        },
      },
      { $sort: { wisdomPoints: -1 } },
      { $limit: 3 },
    ]);
    res.json(topSages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// NEW ENDPOINT: Class Results
app.get("/api/classResults", async (req, res) => {
  try {
    const results = await SubjectMark.aggregate([
      {
        $group: {
          _id: "$user",
          totalMarks: { $sum: { $add: ["$cia1", "$cia2", "$midSem", "$endSem"] } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          overall: { $multiply: [{ $divide: ["$totalMarks", { $multiply: ["$count", 120] }] }, 100] },
        },
      },
      { $sort: { overall: -1 } },
    ]);
    const totalStudents = results.length;
    const classAverageResult = results.reduce((acc, curr) => acc + curr.overall, 0) / (totalStudents || 1);
    res.json({ classAverageResult, results, totalStudents });
  } catch (error) {
    console.error("Error computing class results:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== QUIZ APIs ========== **/
// (Quiz APIs as defined above remain unchanged)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
