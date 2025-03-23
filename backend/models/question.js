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

module.exports = mongoose.model("Question", QuestionSchema);
