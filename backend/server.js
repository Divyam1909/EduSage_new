require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
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
  realPassword: { type: String, required: true },
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
const Event = require("./models/Event.js");

/** ========== QUESTION MODEL ========== **/
const Question = require("./models/question.js");

/** ========== NEW ANSWER SCHEMA ========== **/
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
const uploadHandler = multer(); // Using memory storage
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

app.get("/api/questions/:id/answers", async (req, res) => {
  try {
    const answers = await Answer.find({ questionId: req.params.id }).sort({ answeredAt: -1 });
    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

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

/** ========== NEW QUIZ MODELS & APIs ========== **/
const Quiz = require("./models/Quiz.js");
const QuizAttempt = require("./models/QuizAttempt.js");

// Create a new Quiz
app.post("/api/quizzes", async (req, res) => {
  try {
    const { title, topic, difficulty, timeLimit, points, questions } = req.body;
    if (!title || !topic || !difficulty || timeLimit <= 0 || points <= 0 || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "All quiz fields are required and must be valid" });
    }
    const newQuiz = new Quiz({ title, topic, difficulty, timeLimit, points, questions });
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
      const isCorrect = userAnswer === q.correctAnswer;
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
    });
    await newAttempt.save();
    console.log("Quiz attempt saved with total score:", totalScore);
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

// DELETE all quiz attempts for a given user
app.delete("/api/quizAttempts/clearAll", async (req, res) => {
  try {
    console.log("Clear all attempts requested for user:", req.query.user);
    const user = req.query.user;
    if (!user) return res.status(400).json({ message: "User required" });
    await QuizAttempt.deleteMany({ user });
    console.log("All attempts cleared for user:", user);
    res.json({ message: "All attempts cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/*START SERVER*/
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  