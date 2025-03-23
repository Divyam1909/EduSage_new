const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, default: "" },
  details: { type: String, default: "" },
  importedFromPdf: { type: Boolean, default: false },
  notifications: {
    dayBefore: { type: Boolean, default: true },
    dayOf: { type: Boolean, default: true },
    atTime: { type: Boolean, default: true }
  },
  notificationStatus: {
    dayBeforeSent: { type: Boolean, default: false },
    dayOfSent: { type: Boolean, default: false },
    atTimeSent: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("Event", EventSchema);
