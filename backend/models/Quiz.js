const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true },
  timeLimit: { type: Number, required: true },
  points: { type: Number, required: true },
  questions: [
    {
      questionText: { type: String, required: true },
      isMCQ: { type: Boolean, default: true },
      options: { type: [String], required: true },
      correctAnswer: { type: String, required: true },
      marks: { type: Number, default: 0 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quiz", QuizSchema);
