require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { cleanupOldLogs } = require('./logManager');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    // Start the notification checker after DB connection is established
    startNotificationChecker();
  })
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
  approved: { type: Boolean, default: false },
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
    const events = await Event.find();
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
app.get("/api/notifications/pending", async (req, res) => {
  try {
    const now = new Date();
    const pendingNotifications = [];
    
    // Get all events
    const events = await Event.find();
    
    for (const event of events) {
      const eventDate = new Date(event.date);
      const dayBefore = new Date(eventDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      
      // Normalize dates to start of day for comparison
      const nowStartOfDay = new Date(now);
      nowStartOfDay.setHours(0, 0, 0, 0);
      
      const eventStartOfDay = new Date(eventDate);
      eventStartOfDay.setHours(0, 0, 0, 0);
      
      const dayBeforeStartOfDay = new Date(dayBefore);
      dayBeforeStartOfDay.setHours(0, 0, 0, 0);
      
      // Day before notification check
      if (
        event.notifications.dayBefore && 
        !event.notificationStatus.dayBeforeSent && 
        nowStartOfDay.getTime() >= dayBeforeStartOfDay.getTime() && 
        eventDate > now
      ) {
        pendingNotifications.push({
          id: `${event._id}_dayBefore`,
          eventId: event._id,
          message: `Reminder: "${event.title}" is scheduled for tomorrow.`,
          type: "dayBefore"
        });
        
        // Mark as sent in database
        event.notificationStatus.dayBeforeSent = true;
        await event.save();
      }
      
      // Day of notification check (at 12:00 AM)
      if (
        event.notifications.dayOf && 
        !event.notificationStatus.dayOfSent && 
        nowStartOfDay.getTime() === eventStartOfDay.getTime()
      ) {
        pendingNotifications.push({
          id: `${event._id}_dayOf`,
          eventId: event._id,
          message: `Reminder: "${event.title}" is scheduled for today.`,
          type: "dayOf"
        });
        
        // Mark as sent in database
        event.notificationStatus.dayOfSent = true;
        await event.save();
      }
      
      // At-time notification check
      if (event.notifications.atTime && !event.notificationStatus.atTimeSent && event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventTime = new Date(eventDate);
        eventTime.setHours(hours, minutes, 0, 0);
        
        // Check if it's time for the notification (within the last minute)
        if (
          now.getTime() >= eventTime.getTime() && 
          now.getTime() <= eventTime.getTime() + 60000
        ) {
          pendingNotifications.push({
            id: `${event._id}_atTime`,
            eventId: event._id,
            message: `Reminder: "${event.title}" is starting now.`,
            type: "atTime"
          });
          
          // Mark as sent in database
          event.notificationStatus.atTimeSent = true;
          await event.save();
        }
      }
    }
    
    res.json(pendingNotifications);
  } catch (error) {
    console.error("Error fetching pending notifications:", error);
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
    
    console.log("PDF file received, size:", req.file.size, "bytes");
    
    // Simple check to ensure it's likely a PDF
    if (req.file.mimetype !== 'application/pdf') {
      console.log("Warning: File mimetype is not PDF:", req.file.mimetype);
    }
    
    // Validate buffer is not empty
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ message: "Uploaded file buffer is empty" });
    }
    
    console.log("Extracting events from PDF...");
    const events = await extractEventsFromPDF(req.file.buffer);
    
    if (!events || events.length === 0) {
      console.log("No events were extracted from the PDF");
      return res.status(400).json({ message: "No events found in the uploaded file. The PDF format may not be supported." });
    }
    
    console.log(`Extracted ${events.length} events, saving to database...`);
    
    // Add notification settings to each event from PDF
    const eventsWithNotifications = events.map(event => ({
      ...event,
      importedFromPdf: true,
      notifications: {
        dayBefore: true,
        dayOf: true,
        atTime: event.time ? true : false
      },
      notificationStatus: {
        dayBeforeSent: false,
        dayOfSent: false,
        atTimeSent: false
      }
    }));
    
    await Event.insertMany(eventsWithNotifications);
    console.log(`Successfully saved ${events.length} events from PDF`);
    
    res.status(200).json({ 
      message: `${events.length} events uploaded successfully`, 
      events,
      count: events.length
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    // Send detailed error message to help debugging
    res.status(500).json({ 
      message: "Error processing PDF", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/** ========== NEW ENDPOINT: Delete All PDF-Imported Events ========== **/
app.delete("/api/calendar/pdf-events", async (req, res) => {
  try {
    console.log("Deleting all events imported from PDFs...");
    const result = await Event.deleteMany({ importedFromPdf: true });
    console.log(`Deleted ${result.deletedCount} PDF-imported events`);
    res.status(200).json({ 
      message: `${result.deletedCount} PDF-imported events deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting PDF events:", error);
    res.status(500).json({ message: "Server error deleting PDF events" });
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
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Error creating question:", error);
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
    const answers = await Answer.find({ questionId: req.params.id }).sort({ answeredAt: -1 });
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
// Updated to sort by wisdom points (which includes points earned from approved answers)
app.get("/api/top-sages", async (req, res) => {
  try {
    // Get top users by wisdom points
    const topSages = await User.find()
      .sort({ wisdomPoints: -1 })
      .limit(3)
      .select('name rollno photoUrl wisdomPoints');
    
    // Format the response
    const formattedTopSages = topSages.map(user => ({
      name: user.name,
      rollno: user.rollno,
      photoUrl: user.photoUrl,
      rawWisdomPoints: user.wisdomPoints
    }));
    
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
    
    // Update user's quizzesAttempted count
    await User.findOneAndUpdate({ rollno: user }, { $inc: { quizzesAttempted: 1 } });
    
    // Recalculate wisdom points for the user
    await recalculateWisdomPoints(user);
    
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
    
    // Add points from approved answers (20 points per approved answer)
    const approvedAnswers = await Answer.find({ user: rollno, approved: true });
    wisdomPoints += approvedAnswers.length * 20;
    
    // Add points from quiz attempts
    const quizAttempts = await QuizAttempt.find({ user: rollno });
    wisdomPoints += quizAttempts.reduce((sum, attempt) => sum + attempt.totalScore, 0);
    
    // Add raw marks from subjects (all marks added directly)
    const subjectMarks = await SubjectMark.find({ user: rollno });
    subjectMarks.forEach(mark => {
      wisdomPoints += mark.cia1 + mark.cia2 + mark.midSem + mark.endSem;
    });
    
    // Update user's wisdom points
    user.wisdomPoints = wisdomPoints;
    await user.save();
    
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

// Function to check and process notifications
async function checkAndProcessNotifications() {
  const now = new Date();
  logToFile(`Checking for notifications at ${now.toISOString()}`);
  
  // Find all events that have not had all notifications sent
  const events = await Event.find({
    $or: [
      { "notificationStatus.dayBeforeSent": false },
      { "notificationStatus.dayOfSent": false },
      { "notificationStatus.atTimeSent": false }
    ]
  });
  
  logToFile(`Found ${events.length} events with pending notifications`);
  
  for (const event of events) {
    const eventDate = new Date(event.date);
    const dayBefore = new Date(eventDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    
    // Normalize dates to start of day for comparison
    const nowStartOfDay = new Date(now);
    nowStartOfDay.setHours(0, 0, 0, 0);
    
    const eventStartOfDay = new Date(eventDate);
    eventStartOfDay.setHours(0, 0, 0, 0);
    
    const dayBeforeStartOfDay = new Date(dayBefore);
    dayBeforeStartOfDay.setHours(0, 0, 0, 0);
    
    // Get the event time if specified
    let eventTime = null;
    if (event.time) {
      const [hours, minutes] = event.time.split(':').map(Number);
      eventTime = new Date(eventDate);
      eventTime.setHours(hours, minutes, 0, 0);
    }
    
    // Check for day before notification
    if (event.notifications.dayBefore && !event.notificationStatus.dayBeforeSent && 
        nowStartOfDay.getTime() >= dayBeforeStartOfDay.getTime()) {
      logToFile(`Sending day-before notification for event: ${event.title}`);
      await sendNotification(event, "day-before");
      event.notificationStatus.dayBeforeSent = true;
      await event.save();
    }
    
    // Check for day of notification (at 12:00 AM)
    if (event.notifications.dayOf && !event.notificationStatus.dayOfSent && 
        nowStartOfDay.getTime() >= eventStartOfDay.getTime()) {
      logToFile(`Sending day-of notification for event: ${event.title}`);
      await sendNotification(event, "day-of");
      event.notificationStatus.dayOfSent = true;
      await event.save();
    }
    
    // Check for at-time notification (if time is specified)
    if (event.notifications.atTime && !event.notificationStatus.atTimeSent && 
        eventTime && now.getTime() >= eventTime.getTime()) {
      logToFile(`Sending at-time notification for event: ${event.title}`);
      await sendNotification(event, "at-time");
      event.notificationStatus.atTimeSent = true;
      await event.save();
    }
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
