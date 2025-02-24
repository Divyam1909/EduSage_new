const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  rollno: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  branch: { type: String, required: true },
  sem: { type: Number, required: true },
  dateOfBirth: { type: Date, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
