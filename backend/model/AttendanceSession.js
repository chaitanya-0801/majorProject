import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, unique: true, index: true },
    teacher_email: { type: String, required: true, index: true },
    teacher_name: { type: String, default: "Faculty" },
    class_id: { type: String, index: true },
    class_code: { type: String, trim: true, uppercase: true, index: true },
    class_name: { type: String, default: "B.Tech CSE - 4th Year" },
    subject_id: { type: String, index: true },
    course_code: { type: String, default: "CS301" },
    subject_name: { type: String, default: "General Lecture" },
    name: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: String, required: true },
    location: { type: String, required: true }, // "lat,lng"
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, required: true, default: 50 }, // in meters
    status: {
      type: String,
      enum: ["active", "paused", "ended"],
      default: "active",
      index: true,
    },
    qr_token: { type: String },
    qr_token_expires_at: { type: Date },
    attendance_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model("AttendanceSession", attendanceSessionSchema);
export default AttendanceSession;
