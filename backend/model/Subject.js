import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subject_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    class_id: {
      type: String,
      required: true,
      ref: "Class",
      index: true,
      trim: true,
    },
    teacher_email: {
      type: String,
      default: "teacher@jmit.ac.in",
      trim: true,
    },
    credits: {
      type: Number,
      default: 4,
    },
    description: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Ensure a subject code is unique per class
subjectSchema.index({ class_id: 1, code: 1 }, { unique: true });

export const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;
