import { Router } from "express";
const router = Router();
import UserController from "../controllers/UserController.js";
import JWT from "../middleware/JWT.js";

// Authentication
router.post("/signin", UserController.Login);
router.post("/signup", UserController.Signup);
router.post("/sendmail", UserController.SendMail);
router.post("/verifyotp", UserController.VerifyOTP);
router.post("/forgotpassword", UserController.ForgotPassword);

// User Profile
router.get("/profile", JWT.verifyToken, UserController.GetProfile);
router.post("/edituserdetails", JWT.verifyToken, UserController.EditUserDetails);

// Administrator Routes
router.get(
  "/admin/users",
  JWT.verifyToken,
  JWT.requireRole(["admin", "teacher"]),
  UserController.GetAllUsers
);
router.post(
  "/admin/updaterole",
  JWT.verifyToken,
  JWT.requireRole(["admin"]),
  UserController.UpdateUserRole
);
router.post(
  "/admin/reassign-class",
  JWT.verifyToken,
  JWT.requireRole(["admin"]),
  UserController.ReassignStudentClass
);

export default router;
