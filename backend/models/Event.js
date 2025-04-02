const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  time: { type: String, default: "" },
  details: { type: String, default: "" },
  importedFromPdf: { type: Boolean, default: false, index: true },
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

// Compound indexes for notification queries
EventSchema.index({ "notifications.dayBefore": 1, "notificationStatus.dayBeforeSent": 1, "date": 1 });
EventSchema.index({ "notifications.dayOf": 1, "notificationStatus.dayOfSent": 1, "date": 1 });
EventSchema.index({ "notifications.atTime": 1, "notificationStatus.atTimeSent": 1, "date": 1, "time": 1 });

module.exports = mongoose.model("Event", EventSchema);
