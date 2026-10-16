import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const savedPlanSchema = new mongoose.Schema({
  plan_id: { type: String, required: true },
  title: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  summary: { type: String },
  weekly_schedule: [
    {
      day: { type: String, required: true },
      subject: { type: String, required: true },
      topic: { type: String, required: true },
      allocated_hours: { type: Number, default: 1.5 },
      focus_type: { type: String, default: "revision" }, // theory, problem_solving, revision, mock_quiz
    },
  ],
  focus_topics: [{ type: String }],
  notes: { type: String },
});

const chatHistorySchema = new mongoose.Schema(
  {
    student_email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    messages: [messageSchema],
    saved_plans: [savedPlanSchema],
  },
  { timestamps: true }
);

export const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
export default ChatHistory;
