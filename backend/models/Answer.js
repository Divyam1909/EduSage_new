const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true, index: true },
  user: { type: String, required: true, index: true },
  content: { type: String, required: true },
  answeredAt: { type: Date, default: Date.now },
  attachments: { type: Array, default: [] },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  approved: { type: Boolean, default: false, index: true },
});

module.exports = mongoose.model("Answer", AnswerSchema); 