const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, default: "" },
  details: { type: String, default: "" },
});

module.exports = mongoose.model("Event", EventSchema);
