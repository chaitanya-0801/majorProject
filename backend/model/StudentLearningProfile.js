import mongoose from "mongoose";

const learningGapSchema = new mongoose.Schema({
  topic_id: { type: String, required: true },
  topic_title: { type: String, required: true },
  course_code: { type: String, required: true },
  score_percentage: { type: Number, required: true },
  severity: {
    type: String,
    enum: ["critical", "moderate", "minor"],
    default: "moderate",
  },
  detected_at: { type: Date, default: Date.now },
});

const suggestedActivitySchema = new mongoose.Schema({
  activity_id: { type: String, required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["reading", "video", "practice_quiz", "coding_exercise", "revision"],
    default: "reading",
  },
  duration_minutes: { type: Number, default: 30 },
  resource_url: { type: String, default: "" },
  completed: { type: Boolean, default: false },
  completed_at: { type: Date },
});

const studyTopicSchema = new mongoose.Schema({
  topic_id: { type: String, required: true },
  topic_title: { type: String, required: true },
  course_code: { type: String, required: true },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "high",
  },
  estimated_hours: { type: Number, default: 4 },
  reason: { type: String, required: true }, // Explainability requirement!
  learning_objectives: [{ type: String }],
  prerequisites: [{ type: String }],
  activities: [suggestedActivitySchema],
  practice_questions: [
    {
      question: String,
      options: [String],
      correct_index: Number,
      explanation: String,
    },
  ],
  progress_status: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started",
  },
});

const studyPlanSchema = new mongoose.Schema({
  plan_id: { type: String, required: true },
  generated_at: { type: Date, default: Date.now },
  week_label: { type: String, default: "Current Week" },
  summary: { type: String, required: true },
  ai_provider: { type: String, default: "Gemini / Deterministic Hybrid" },
  topics: [studyTopicSchema],
});

const studentLearningProfileSchema = new mongoose.Schema(
  {
    student_email: { type: String, required: true, unique: true, index: true },
    student_name: { type: String, required: true },
    enrolled_courses: [{ type: String }], // course codes, e.g. ["CS301", "CS302"]
    preferred_pace: {
      type: String,
      enum: ["standard", "accelerated", "remedial"],
      default: "standard",
    },
    strengths: [{ type: String }],
    learning_gaps: [learningGapSchema],
    active_plan: studyPlanSchema,
    plan_history: [studyPlanSchema],
  },
  { timestamps: true }
);

export const StudentLearningProfile = mongoose.model(
  "StudentLearningProfile",
  studentLearningProfileSchema
);
export default StudentLearningProfile;
