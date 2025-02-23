const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  courseName: { type: String, required: true },
  fileLink: { type: String, required: true },
  bookmarked: { type: Boolean, default: false }  // New field for bookmarking
});

module.exports = mongoose.model("Resource", ResourceSchema);
