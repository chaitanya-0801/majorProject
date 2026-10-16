import { Router } from "express";
const router = Router();
import upload from "../middleware/multer.js";
import SessionController from "../controllers/SessionController.js";
import JWT from "../middleware/JWT.js";

// Session Creation
router.post("/create", JWT.verifyToken, SessionController.CreateNewSession);

// Teacher: Get all sessions
router.post("/getSessions", JWT.verifyToken, SessionController.GetAllTeacherSessions);

// Get dynamic QR Code
router.post("/getQR", JWT.verifyToken, SessionController.GetQR);

// Lifecycle: Start, pause, end session
router.post("/updateStatus", JWT.verifyToken, SessionController.UpdateSessionStatus);

// Delete session
router.post("/deleteSession", JWT.verifyToken, SessionController.deleteSession);

// Student: Verify session access & eligibility before submission
router.post("/verify-eligibility", JWT.verifyToken, SessionController.VerifySessionEligibility);

// Student: Submit attendance (multipart form with image upload, strictly authenticated)
router.post(
  "/attend_session",
  JWT.verifyToken,
  upload.single("image"),
  SessionController.AttendSession
);

// Student: Get attendance records history
router.post("/getStudentSessions", JWT.verifyToken, SessionController.GetStudentSessions);

// Teacher: Get full session details and student submissions
router.post("/getSessionDetails", JWT.verifyToken, SessionController.GetSessionDetails);

// Teacher: Correct attendance with mandatory reason
router.post("/correctAttendance", JWT.verifyToken, SessionController.CorrectAttendance);

// Export attendance to CSV
router.get("/exportCsv", SessionController.ExportSessionAttendance);

// Faculty: Active sessions (Teacher only; not discoverable by students)
router.get("/active", JWT.verifyToken, SessionController.GetActiveSessions);

export default router;
