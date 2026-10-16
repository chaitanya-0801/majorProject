import mongoose from "mongoose";

const topicResultSchema = new mongoose.Schema({
  topic_id: { type: String, required: true },
  topic_title: { type: String, required: true },
  score: { type: Number, required: true },
  max_score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  mastery_level: {
    type: String,
    enum: ["mastered", "proficient", "needs_improvement", "critical_gap"],
    required: true,
  },
});

const assessmentResultSchema = new mongoose.Schema(
  {
    result_id: { type: String, required: true, unique: true, index: true },
    assessment_id: { type: String, required: true, index: true },
    course_code: { type: String, required: true, index: true },
    student_email: { type: String, required: true, index: true },
    student_name: { type: String, required: true },
    total_score: { type: Number, required: true },
    max_marks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    topic_breakdown: [topicResultSchema],
    answers: [
      {
        question_id: String,
        selected_index: Number,
        is_correct: Boolean,
      },
    ],
  },
  { timestamps: true }
);

// Compound index for querying student results per course
assessmentResultSchema.index({ student_email: 1, course_code: 1 });

export const AssessmentResult = mongoose.model("AssessmentResult", assessmentResultSchema);
export default AssessmentResult;
