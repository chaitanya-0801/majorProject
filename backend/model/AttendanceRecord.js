import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true },
    student_email: { type: String, required: true, index: true },
    student_name: { type: String, required: true },
    regno: { type: String, required: true },
    teacher_email: { type: String, required: true, index: true },
    subject_name: { type: String, default: "General Lecture" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    student_location: { type: String, required: true }, // "lat,lng"
    student_latitude: { type: Number },
    student_longitude: { type: Number },
    distance: { type: Number, required: true }, // in meters
    allowed_radius: { type: Number, required: true }, // in meters
    status: {
      type: String,
      enum: ["present", "late", "flagged_distance", "rejected", "excused"],
      default: "present",
      index: true,
    },
    verification_status: {
      type: String,
      enum: ["verified", "distance_exceeded", "manual_override", "pending_review"],
      default: "verified",
    },
    image: { type: String, required: true },
    ip_address: { type: String, default: "0.0.0.0" },
    audit_history: [
      {
        previous_status: String,
        new_status: String,
        changed_by: String,
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate attendance per student per session at database engine level
attendanceRecordSchema.index({ session_id: 1, student_email: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema);
export default AttendanceRecord;
