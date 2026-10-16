import mongoose from "mongoose";
const schema = mongoose.Schema;

const userSchema = new schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    pno: { type: String, required: true },
    dob: { type: String, required: true },
    password: { type: String, required: true },
    identityNumber: { type: schema.Types.Mixed, required: true },
    role: { type: String, default: "student" },
    class_id: { type: String, ref: "Class", index: true },
    class_code: { type: String, trim: true, uppercase: true, index: true },
    class_name: { type: String, default: "B.Tech CSE - 4th Year" },
    enrolled_courses: [{ type: String }],
    sessions: [
      {
        session_id: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        name: { type: String, required: true },
        duration: { type: String, required: true },
        distance: { type: String, required: true },
        radius: { type: String, required: true },
        student_location: { type: String, required: false },
        image: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Student = mongoose.model("student", userSchema);
export default Student;
