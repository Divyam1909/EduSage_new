require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const compression = require("compression");
const { cleanupOldLogs } = require('./logManager');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Event = require("./models/Event.js");
const Question = require("./models/question.js");
const Answer = require('./models/Answer');
const SubjectMark = require('./models/SubjectMark');
const Quiz = require("./models/Quiz.js");
const QuizAttempt = require("./models/QuizAttempt.js");

// Import routes
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();

// Define multer upload handler for file uploads
const uploadHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Add compression middleware for all routes
app.use(compression());

// Body parser - increase limit and optimize json parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS setup with optimized settings
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Restrict to known origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Explicitly allow methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Restrict headers
  credentials: true // Allow credentials
}));

// Simple in-memory cache
const cache = {
  data: {},
  timeout: {},
  set: function(key, data, ttl = 60000) { // Default TTL: 60 seconds
    this.data[key] = data;
    clearTimeout(this.timeout[key]);
    this.timeout[key] = setTimeout(() => {
      delete this.data[key];
      delete this.timeout[key];
    }, ttl);
  },
  get: function(key) {
    return this.data[key];
  },
  invalidate: function(key) {
    delete this.data[key];
    clearTimeout(this.timeout[key]);
    delete this.timeout[key];
  },
  clear: function() {
    for (const key in this.timeout) {
      clearTimeout(this.timeout[key]);
    }
    this.data = {};
    this.timeout = {};
  }
};

// Serve static files from the uploads directory with cache control
app.use('/uploads', express.static('uploads', {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// Connect to MongoDB with improved connection options
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  })
  .then(() => {
    console.log("MongoDB connected");
    // Start the notification checker after DB connection is established
    startNotificationChecker();
    
    // Update questionsAsked field for all users
    updateQuestionsAskedForAllUsers();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

/** ========== MODELS ========== **/
// Models are now required from their separate files

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
      wisdomPoints: 0,
      experience: 0,
      rank: 0,
      questionsAnswered: 0,
      questionsAsked: 0,
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
    const resources = await Resource.find().lean();
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
    const bookmarkedResources = await Resource.find({ bookmarked: true }).lean();
    res.json(bookmarkedResources);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== EVENT APIs ========== **/
app.post("/api/events", async (req, res) => {
  try {
    const { title, date, time, details, notifications } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }
    
    // Create a new event with notification settings
    const newEvent = new Event({ 
      title, 
      date, 
      time, 
      details, 
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
    
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().lean();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    const { title, date, time, details, notifications } = req.body;
    
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

/** ========== NEW ENDPOINT: Retrieve Pending Notifications ========== **/
// Optimized to query only potentially relevant events
app.get("/api/notifications/pending", async (req, res) => {
  try {
    const now = new Date();
    const pendingNotifications = [];

    const nowTime = now.getTime();
    const nowStartOfDay = new Date(now);
    nowStartOfDay.setHours(0, 0, 0, 0);
    const nowStartOfDayTime = nowStartOfDay.getTime();

    const dayAfterNowStartOfDay = new Date(nowStartOfDay);
    dayAfterNowStartOfDay.setDate(dayAfterNowStartOfDay.getDate() + 1);
    const dayAfterNowStartOfDayTime = dayAfterNowStartOfDay.getTime();

    // --- Check for Day Before Notifications --- 
    const dayBeforeEvents = await Event.find({
      "notifications.dayBefore": true,
      "notificationStatus.dayBeforeSent": false,
      date: { 
        $gt: now, // Event date must be in the future
        $lte: dayAfterNowStartOfDay // Event date is tomorrow (at start of day)
      }
    }).lean();
    
    dayBeforeEvents.forEach(event => {
        pendingNotifications.push({
          id: `${event._id}_dayBefore`,
          eventId: event._id,
          message: `Reminder: "${event.title}" is scheduled for tomorrow.`,
          type: "dayBefore"
        });
        // NOTE: We don't mark as sent here, as this endpoint is just for *retrieving* pending ones.
        // The actual marking happens in checkAndProcessNotifications
    });

    // --- Check for Day Of Notifications --- 
    const dayOfEvents = await Event.find({
      "notifications.dayOf": true,
      "notificationStatus.dayOfSent": false,
      date: { 
        $gte: nowStartOfDay, // Event date is today (start of day)
        $lt: dayAfterNowStartOfDay // Event date is today (end of day)
      }
    }).lean();

    dayOfEvents.forEach(event => {
        pendingNotifications.push({
          id: `${event._id}_dayOf`,
          eventId: event._id,
          message: `Reminder: "${event.title}" is scheduled for today.`,
          type: "dayOf"
        });
    });

    // --- Check for At Time Notifications ---
    const potentiallyDueAtTimeEvents = await Event.find({
      "notifications.atTime": true,
      "notificationStatus.atTimeSent": false,
      date: { 
        $gte: nowStartOfDay, // Event is today
        $lt: dayAfterNowStartOfDay
      },
      time: { $ne: "" } // Only consider events with a specific time
    }).lean();

    potentiallyDueAtTimeEvents.forEach(event => {
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventDateTime = new Date(event.date);
        eventDateTime.setHours(hours, minutes, 0, 0);
        const eventTime = eventDateTime.getTime();

        // Check if the current time is past the event's start time
        // Allow a small window (e.g., 5 minutes) after the start time for the notification to still appear as pending
        if (nowTime >= eventTime && nowTime <= eventTime + (5 * 60 * 1000)) {
          pendingNotifications.push({
            id: `${event._id}_atTime`,
            eventId: event._id,
            message: `Reminder: "${event.title}" is starting now.`,
            type: "atTime"
          });
        }
    });
    
    res.json(pendingNotifications);
  } catch (error) {
    console.error("Error fetching pending notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== QUESTION APIs ========== **/
app.post("/api/questions", authenticateToken, async (req, res) => {
  try {
    const { title, details, subject } = req.body;
    if (!title || !subject) {
      return res.status(400).json({ message: "Title and subject are required" });
    }
    
    // Create new question
    const newQuestion = new Question({
      title,
      details,
      subject,
      askedBy: req.user.rollno,
      wisdomPoints: 20,
    });
    await newQuestion.save();
    
    // Update user's questionsAsked count
    await User.findOneAndUpdate(
      { rollno: req.user.rollno },
      { $inc: { questionsAsked: 1 } }
    );
    
    // Recalculate wisdom points for the user
    await recalculateWisdomPoints(req.user.rollno);
    
    cache.invalidate('all_questions');
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/questions", async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'all_questions';
    const cachedQuestions = cache.get(cacheKey);
    if (cachedQuestions) {
      return res.json(cachedQuestions);
    }

    // If not in cache, fetch from DB with lean() for better performance
    const questions = await Question.find()
      .sort({ askedAt: -1 })
      .lean()
      .exec();
    
    // Store in cache for 30 seconds
    cache.set(cacheKey, questions, 30000);
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/questions/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).lean();
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a question - only the user who asked can delete
app.delete("/api/questions/:id", authenticateToken, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    // Check if the authenticated user is the one who asked the question
    if (question.askedBy !== req.user.rollno) {
      return res.status(403).json({ message: "Not authorized to delete this question" });
    }
    
    // Get all answers to collect their users
    const answers = await Answer.find({ questionId: question._id });
    const answerUserIds = answers.map(answer => answer.user);
    
    // Delete all answers to this question
    await Answer.deleteMany({ questionId: question._id });
    
    // Delete the question
    await question.deleteOne();
    
    // Recalculate wisdom points for all users who answered the question
    const uniqueUsers = [...new Set([...answerUserIds, req.user.rollno])];
    for (const userId of uniqueUsers) {
      await recalculateWisdomPoints(userId);
    }
    
    cache.invalidate('all_questions');
    
    res.json({ message: "Question and its answers deleted successfully" });
  } catch (error) {
    console.error("Error deleting question", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve an answer - only the user who asked the question can approve
app.put("/api/questions/:questionId/approve/:answerId", authenticateToken, async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    
    // Get the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Check if the authenticated user is the one who asked the question
    if (question.askedBy !== req.user.rollno) {
      return res.status(403).json({ message: "Not authorized to approve answers for this question" });
    }
    
    // Get the answer
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    // If another answer was previously approved, unapprove it
    if (question.approvedAnswerId) {
      await Answer.findByIdAndUpdate(question.approvedAnswerId, { approved: false });
    }
    
    // Mark the question as solved and save the approved answer ID
    question.solved = true;
    question.approvedAnswerId = answerId;
    
    // Set the question's wisdom points to a fixed value of 20
    question.wisdomPoints = 20;
    await question.save();
    
    // Mark the answer as approved
    answer.approved = true;
    await answer.save();
    
    // Recalculate wisdom points for the user who answered
    if (answer.user !== "You") { // For real users, not demo answers
      // Recalculate their wisdom points
      await recalculateWisdomPoints(answer.user);
    }
    
    cache.invalidate('all_questions');
    
    res.json({ message: "Answer approved successfully", question, answer });
  } catch (error) {
    console.error("Error approving answer", error);
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
    const answers = await Answer.find({ questionId: req.params.id }).sort({ answeredAt: -1 }).lean();
    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Post an answer for a question
app.post("/api/questions/:id/answers", authenticateToken, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const user = req.user.rollno; // Get user from token

    // Find the question
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Create the answer
    const answer = new Answer({
      questionId: req.params.id,
      user,
      content,
      answeredAt: new Date(),
    });

    // Save answer
    await answer.save();

    // Increment question's answer count
    question.answers = (question.answers || 0) + 1;
    await question.save();
    
    // Increment user's questionsAnswered count
    await User.findOneAndUpdate(
      { rollno: user },
      { $inc: { questionsAnswered: 1 } }
    );

    // Automatically recalculate wisdom points after submitting an answer
    await recalculateWisdomPoints(user);

    cache.invalidate('all_questions');
    
    res.status(201).json(answer);
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update an answer
app.put("/api/answers/:id", authenticateToken, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    // Only allow the user who created the answer to update it
    if (answer.user !== req.user.rollno) {
      return res.status(403).json({ message: "Not authorized to update this answer" });
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
app.delete("/api/answers/:id", authenticateToken, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    // Only allow the user who created the answer to delete it
    if (answer.user !== req.user.rollno) {
      return res.status(403).json({ message: "Not authorized to delete this answer" });
    }
    
    await answer.deleteOne();
    await Question.findByIdAndUpdate(answer.questionId, { $inc: { answers: -1 } });
    
    // Recalculate wisdom points after deleting the answer
    await recalculateWisdomPoints(answer.user);

    cache.invalidate('all_questions');
    
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
    const user = await User.findOne({ rollno }).select("-password").lean();
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
// Updated to sort by wisdom points (which includes points earned from approved answers)
app.get("/api/top-sages", async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'top_sages';
    const cachedTopSages = cache.get(cacheKey);
    if (cachedTopSages) {
      return res.json(cachedTopSages);
    }

    // Get top users by wisdom points with lean() for better performance
    const topSages = await User.find()
      .sort({ wisdomPoints: -1 })
      .limit(3)
      .select('name rollno photoUrl wisdomPoints')
      .lean()
      .exec();
    
    // Format the response
    const formattedTopSages = topSages.map(user => ({
      name: user.name,
      rollno: user.rollno,
      photoUrl: user.photoUrl,
      rawWisdomPoints: user.wisdomPoints
    }));
    
    // Cache for 1 minute
    cache.set(cacheKey, formattedTopSages, 60000);
    
    res.json(formattedTopSages);
  } catch (error) {
    console.error("Error fetching top sages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Class Results endpoint
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
    const quizzes = await Quiz.find().lean();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific Quiz by ID
app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).lean();
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
    const { user, answers, timeTaken, tabViolation } = req.body;
    const quiz = await Quiz.findById(req.params.id).lean().exec();
    if (!quiz) {
      console.error("Quiz not found for ID:", req.params.id);
      return res.status(404).json({ message: "Quiz not found" });
    }
    let totalScore = 0;
    
    // Check if we should apply a penalty for tab violations
    const applyPenalty = tabViolation === true;
    
    const processedAnswers = quiz.questions.map((q, index) => {
      const userAnswerObj = answers.find((ans) => ans.questionId === index);
      // Ensure we have a string, even if empty
      const userAnswer = userAnswerObj && userAnswerObj.answer !== null && userAnswerObj.answer !== undefined
        ? String(userAnswerObj.answer) // Convert to string to be safe
        : "";
      
      // If there's a tab violation, automatically mark as incorrect
      let isCorrect = false;
      if (!applyPenalty) {
        isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      }
      
      const marksObtained = isCorrect ? (q.marks || 0) : 0;
      totalScore += marksObtained;
      
      return { 
        questionId: index, 
        answer: userAnswer, 
        correct: isCorrect, 
        marksObtained 
      };
    });
    
    // Ensure the total score doesn't exceed the quiz's total points value
    // This prevents scoring issues where marks might add up to more than the quiz's intended points
    if (totalScore > quiz.points) {
      console.log(`Score adjustment: ${totalScore} capped to ${quiz.points} points for quiz ${quiz.title}`);
      totalScore = quiz.points;
    }
    
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
    
    // Update user's quizzesAttempted count
    await User.findOneAndUpdate({ rollno: user }, { $inc: { quizzesAttempted: 1 } });
    
    // Recalculate wisdom points for the user
    await recalculateWisdomPoints(user);
    
    // Invalidate related caches
    cache.invalidate('top_sages');
    
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
    const attempts = await QuizAttempt.find({ user }).populate("quizId").lean();
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
    
    // Recalculate wisdom points after clearing attempts
    await recalculateWisdomPoints(user);
    
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
    
    // Recalculate wisdom points after deleting the attempt
    await recalculateWisdomPoints(attempt.user);
    
    res.json({ message: "Attempt cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/** ========== SUBJECT MARKS & STATS APIs ========== **/
// Get subject marks for the logged-in user
app.get("/api/user/stats/subject", authenticateToken, async (req, res) => {
  try {
    const marks = await SubjectMark.find({ user: req.user.rollno }).lean();
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
    
    // Automatically recalculate wisdom points after adding marks
    await recalculateWisdomPoints(req.user.rollno);
    
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
    
    // Automatically recalculate wisdom points after updating marks
    await recalculateWisdomPoints(req.user.rollno);
    
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
    
    // Automatically recalculate wisdom points after deleting marks
    await recalculateWisdomPoints(req.user.rollno);
    
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Calculate and update user's wisdom points
async function recalculateWisdomPoints(rollno) {
  try {
    // Get user
    const user = await User.findOne({ rollno });
    if (!user) return null;

    // Start with 0 wisdom points
    let wisdomPoints = 0;

    // Use promise.all for parallel processing
    const [approvedAnswersCount, quizScoreSum, subjectMarksSum] = await Promise.all([
      // Count approved answers (efficient)
      Answer.countDocuments({ user: rollno, approved: true }).exec(),
      
      // Aggregate total quiz scores directly in the DB
      QuizAttempt.aggregate([
        { $match: { user: rollno } },
        { $group: { _id: null, totalQuizScore: { $sum: "$totalScore" } } }
      ]).exec(),
      
      // Aggregate total subject marks directly in the DB
      SubjectMark.aggregate([
        { $match: { user: rollno } },
        { 
          $group: { 
            _id: null, 
            totalSubjectMarks: { 
              $sum: { $add: ["$cia1", "$cia2", "$midSem", "$endSem"] } 
            }
          }
        }
      ]).exec()
    ]);

    // Add points from approved answers (20 points per approved answer)
    wisdomPoints += approvedAnswersCount * 20;

    // Add points from aggregated quiz attempts
    if (quizScoreSum.length > 0) {
      wisdomPoints += quizScoreSum[0].totalQuizScore || 0;
    }

    // Add points from aggregated subject marks
    if (subjectMarksSum.length > 0) {
      wisdomPoints += subjectMarksSum[0].totalSubjectMarks || 0;
    }

    // Update user's wisdom points
    user.wisdomPoints = wisdomPoints;
    await user.save();

    // Invalidate related caches
    cache.invalidate('top_sages');

    return wisdomPoints;
  } catch (error) {
    console.error("Error recalculating wisdom points:", error);
    return null;
  }
}

/** ========== EVENT NOTIFICATION SYSTEM ========== **/
// Add a new endpoint to check for pending notifications
app.get("/api/notifications/check", async (req, res) => {
  try {
    await checkAndProcessNotifications();
    res.json({ message: "Notification check completed" });
  } catch (error) {
    console.error("Error checking notifications:", error);
    res.status(500).json({ message: "Error checking notifications" });
  }
});

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Logger utility function
function logToFile(message, type = 'notification') {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timestamp = now.toISOString();
  const logFile = path.join(logsDir, `${type}-${dateStr}.log`);
  
  const logEntry = `[${timestamp}] ${message}\n`;
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error(`Error writing to log file: ${err.message}`);
    }
  });
}

// Function to check and process notifications (Optimized)
async function checkAndProcessNotifications() {
  const now = new Date();
  logToFile(`Checking for notifications at ${now.toISOString()}`, 'notification');

  const nowTime = now.getTime();
  const nowStartOfDay = new Date(now);
  nowStartOfDay.setHours(0, 0, 0, 0);
  const nowStartOfDayTime = nowStartOfDay.getTime();

  const dayAfterNowStartOfDay = new Date(nowStartOfDay);
  dayAfterNowStartOfDay.setDate(dayAfterNowStartOfDay.getDate() + 1);
  const dayAfterNowStartOfDayTime = dayAfterNowStartOfDay.getTime();

  try {
    // --- Check for Day Before Notifications --- 
    const dayBeforeEvents = await Event.find({
      "notifications.dayBefore": true,
      "notificationStatus.dayBeforeSent": false,
      date: { 
        $gt: now, // Event date must be in the future
        $lte: dayAfterNowStartOfDay // Event date is tomorrow (at start of day)
      }
    }).lean();

    logToFile(`Found ${dayBeforeEvents.length} events for day-before notification`, 'notification');
    for (const event of dayBeforeEvents) {
      logToFile(`Sending day-before notification for event: ${event.title}`, 'notification');
      await sendNotification(event, "day-before");
      await Event.updateOne({ _id: event._id }, { $set: { "notificationStatus.dayBeforeSent": true } });
    }

    // --- Check for Day Of Notifications --- (Trigger at start of the event day)
    const dayOfEvents = await Event.find({
      "notifications.dayOf": true,
      "notificationStatus.dayOfSent": false,
      date: { 
        $gte: nowStartOfDay, // Event date is today (start of day)
        $lt: dayAfterNowStartOfDay // Event date is today (end of day)
      }
    }).lean();

    logToFile(`Found ${dayOfEvents.length} events for day-of notification`, 'notification');
    for (const event of dayOfEvents) {
      logToFile(`Sending day-of notification for event: ${event.title}`, 'notification');
      await sendNotification(event, "day-of");
      await Event.updateOne({ _id: event._id }, { $set: { "notificationStatus.dayOfSent": true } });
    }

    // --- Check for At Time Notifications --- (Find events starting soon or recently started)
    // Find events scheduled for today where atTime is enabled and not sent
    const potentiallyDueAtTimeEvents = await Event.find({
      "notifications.atTime": true,
      "notificationStatus.atTimeSent": false,
      date: { 
        $gte: nowStartOfDay, // Event is today
        $lt: dayAfterNowStartOfDay
      },
      time: { $ne: "" } // Only consider events with a specific time
    }).lean();

    logToFile(`Found ${potentiallyDueAtTimeEvents.length} potential events for at-time notification`, 'notification');
    const atTimeEventsToSend = [];
    for (const event of potentiallyDueAtTimeEvents) {
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventDateTime = new Date(event.date);
        eventDateTime.setHours(hours, minutes, 0, 0);
        const eventTime = eventDateTime.getTime();

        // Check if the current time is past the event's start time
        if (nowTime >= eventTime) {
          atTimeEventsToSend.push(event);
        }
    }

    logToFile(`Sending ${atTimeEventsToSend.length} at-time notifications`, 'notification');
    for (const event of atTimeEventsToSend) {
      logToFile(`Sending at-time notification for event: ${event.title}`, 'notification');
      await sendNotification(event, "at-time");
      await Event.updateOne({ _id: event._id }, { $set: { "notificationStatus.atTimeSent": true } });
    }

  } catch (error) {
      logToFile(`Error processing notifications: ${error.message}`, 'error');
      console.error("Error processing notifications:", error);
  }
}

// Function to send notification (placeholder for actual implementation)
async function sendNotification(event, type) {
  // In a real implementation, this would send push notifications, emails, or other alerts
  // For now, we'll just log the notification
  const message = {
    "day-before": `Reminder: "${event.title}" is scheduled for tomorrow`,
    "day-of": `Reminder: "${event.title}" is scheduled for today`,
    "at-time": `Reminder: "${event.title}" is starting now`
  }[type];
  
  logToFile(`NOTIFICATION: ${message}`);
  
  // Here you would integrate with a notification service like Firebase Cloud Messaging,
  // send emails, or use browser notifications through a service worker
  
  return true;
}

// Start the notification checker to run every minute
function startNotificationChecker() {
  // Initial check
  checkAndProcessNotifications();
  
  // Schedule checks every minute
  setInterval(checkAndProcessNotifications, 60000);
  
  // Also schedule log cleanup once a day
  setTimeout(() => {
    cleanupOldLogs();
    setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // Run once every 24 hours
  }, 60 * 60 * 1000); // Start after 1 hour
  
  logToFile("Notification checker started", "system");
}

// Function to update questionsAsked field for all users
async function updateQuestionsAskedForAllUsers() {
  try {
    console.log("Updating questionsAsked field for all users...");
    
    // Find all users
    const users = await User.find();
    let updatedCount = 0;
    
    // Process each user
    for (const user of users) {
      // Count questions asked by this user
      const questionCount = await Question.countDocuments({ askedBy: user.rollno });
      
      // If the count doesn't match or field doesn't exist
      if (user.questionsAsked === undefined || user.questionsAsked !== questionCount) {
        await User.updateOne(
          { _id: user._id },
          { $set: { questionsAsked: questionCount } }
        );
        updatedCount++;
      }
    }
    
    console.log(`Updated questionsAsked field for ${updatedCount} users`);
  } catch (error) {
    console.error("Error updating questionsAsked field:", error);
  }
}

// Add API routes
app.use('/api/calendar', calendarRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
