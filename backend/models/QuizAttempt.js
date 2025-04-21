const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  user: { type: String, required: true },
  answers: [
    {
      questionId: { type: Number, required: true },
      answer: { type: String, default: "" },
      correct: { type: Boolean, required: true },
      marksObtained: { type: Number, default: 0 },
    },
  ],
  totalScore: { type: Number, default: 0 },
  timeTaken: { type: Number, required: true },
  clearable: { type: Boolean, default: true },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
