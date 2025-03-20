const mongoose = require("mongoose");

const SubjectMarkSchema = new mongoose.Schema({
  user: { type: String, required: true },
  subject: { type: String, required: true },
  cia1: { type: Number, required: true },
  cia2: { type: Number, required: true },
  midSem: { type: Number, required: true },
  endSem: { type: Number, required: true },
});

module.exports = mongoose.model("SubjectMark", SubjectMarkSchema);
