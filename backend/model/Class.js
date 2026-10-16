import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    class_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    class_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: "Computer Science & Engineering",
      trim: true,
    },
    academic_year: {
      type: String,
      default: "4",
      trim: true,
    },
    section: {
      type: String,
      default: "A",
      trim: true,
    },
    semester: {
      type: Number,
      default: 7,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Pre-save normalization hook ensuring class_code is always trimmed & uppercase
classSchema.pre("save", function (next) {
  if (this.class_code) {
    this.class_code = this.class_code.trim().toUpperCase();
  }
  if (!this.class_id && this.class_code) {
    this.class_id = "CLASS-" + this.class_code;
  }
  next();
});

export const Class = mongoose.model("Class", classSchema);
export default Class;

