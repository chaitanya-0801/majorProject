import { Router } from "express";
const router = Router();
import CurriculumController from "../controllers/CurriculumController.js";
import JWT from "../middleware/JWT.js";

// Course & Syllabus Management
router.get("/courses", JWT.verifyToken, CurriculumController.GetCourses);
router.post("/courses/create", JWT.verifyToken, JWT.requireRole(["teacher", "admin"]), CurriculumController.CreateCourse);
router.get("/courses/:code", JWT.verifyToken, CurriculumController.GetCourseDetails);

// Assessments
router.get("/assessments", JWT.verifyToken, CurriculumController.GetAssessments);
router.post("/assessments/create", JWT.verifyToken, JWT.requireRole(["teacher", "admin"]), CurriculumController.CreateAssessment);
router.post("/assessments/submit", JWT.verifyToken, CurriculumController.SubmitAssessment);

// Academic Analytics (Deterministic)
router.get("/student-analytics", JWT.verifyToken, CurriculumController.GetStudentAnalytics);
router.get("/teacher-analytics", JWT.verifyToken, JWT.requireRole(["teacher", "admin"]), CurriculumController.GetTeacherClassAnalytics);

// AI-Based Personalized Study Plan
router.post("/plan/generate", JWT.verifyToken, CurriculumController.GeneratePersonalizedPlan);
router.get("/plan/active", JWT.verifyToken, CurriculumController.GetActiveStudyPlan);
router.post("/plan/toggle-activity", JWT.verifyToken, CurriculumController.ToggleActivityCompletion);

// Conversational AI Curriculum Assistant (Interactive Chatbot)
router.post("/chat", JWT.verifyToken, CurriculumController.HandleChat);
router.get("/chat/history", JWT.verifyToken, CurriculumController.GetChatHistory);
router.delete("/chat/history", JWT.verifyToken, CurriculumController.ClearChatHistory);
router.post("/chat/save-plan", JWT.verifyToken, CurriculumController.SaveStudyPlanFromChat);
router.get("/chat/saved-plans", JWT.verifyToken, CurriculumController.GetSavedPlans);

export default router;
