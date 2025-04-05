const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollno: { type: String, unique: true, required: true, index: true },
  branch: { type: String, required: true },
  sem: { type: Number, required: true },
  dateOfBirth: { type: Date, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  realPassword: { type: String, required: true },
  wisdomPoints: { type: Number, default: 0, index: true },
  experience: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  questionsAnswered: { type: Number, default: 0 },
  questionsAsked: { type: Number, default: 0 },
  quizzesAttempted: { type: Number, default: 0 },
  photoUrl: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  },
});

module.exports = mongoose.model("User", UserSchema);
