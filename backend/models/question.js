const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  details: { type: String, default: "" },
  subject: { type: String, required: true },
  askedBy: { type: String, required: true },
  wisdomPoints: { type: Number, default: 20 },
  answers: { type: Number, default: 0 },
  askedAt: { type: Date, default: Date.now },
  solved: { type: Boolean, default: false },
  approvedAnswerId: { type: mongoose.Schema.Types.ObjectId, ref: "Answer", default: null },
});

// Add indexes for frequently queried fields to improve performance
QuestionSchema.index({ askedAt: -1 }); // Index for sorting by date
QuestionSchema.index({ subject: 1 }); // Index for filtering by subject
QuestionSchema.index({ askedBy: 1 }); // Index for filtering by user

module.exports = mongoose.model("Question", QuestionSchema);
