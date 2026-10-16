import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  topic_id: { type: String, required: true },
  title: { type: String, required: true },
  learning_objectives: [{ type: String }],
  prerequisites: [{ type: String }],
  estimated_hours: { type: Number, default: 3 },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "intermediate",
  },
  recommended_resources: [
    {
      title: { type: String, required: true },
      type: { type: String, enum: ["video", "article", "documentation", "exercise"], default: "documentation" },
      url: { type: String, required: true },
    },
  ],
});

const unitSchema = new mongoose.Schema({
  unit_number: { type: Number, required: true },
  unit_title: { type: String, required: true },
  topics: [topicSchema],
});

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    department: { type: String, default: "Computer Science" },
    semester: { type: Number, default: 4 },
    teacher_email: { type: String, required: true, index: true },
    units: [unitSchema],
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
export default Course;
