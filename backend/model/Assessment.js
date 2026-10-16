import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question_id: { type: String, required: true },
  question_text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct_index: { type: Number, required: true },
  explanation: { type: String, default: "" },
  topic_id: { type: String, required: true },
  topic_title: { type: String, required: true },
});

const assessmentSchema = new mongoose.Schema(
  {
    assessment_id: { type: String, required: true, unique: true, index: true },
    course_code: { type: String, required: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["quiz", "assignment", "diagnostic", "midterm", "final"],
      default: "quiz",
    },
    topics_covered: [{ type: String }],
    max_marks: { type: Number, required: true, default: 100 },
    passing_percentage: { type: Number, default: 50 },
    questions: [questionSchema],
    created_by: { type: String, required: true },
  },
  { timestamps: true }
);

export const Assessment = mongoose.model("Assessment", assessmentSchema);
export default Assessment;
