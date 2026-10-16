import { Router } from "express";
import ClassController from "../controllers/ClassController.js";
import JWT from "../middleware/JWT.js";

const router = Router();

// Public / Student Registration endpoints
router.get("/", ClassController.GetActiveClasses);
router.get("/lookup/:code", ClassController.LookupClassByCode);
router.get("/:class_id/subjects", ClassController.GetClassSubjects);
router.get("/:class_id", ClassController.GetClassDetails);

// Administrative Class & Subject Management endpoints (Protected: Admin & Faculty)
router.get("/admin/all", JWT.verifyToken, JWT.requireRole(["admin", "teacher"]), ClassController.GetAllAdmin);
router.post("/admin/create-class", JWT.verifyToken, JWT.requireRole(["admin"]), ClassController.CreateClass);
router.post("/admin/update-class", JWT.verifyToken, JWT.requireRole(["admin"]), ClassController.UpdateClass);
router.post("/admin/create-subject", JWT.verifyToken, JWT.requireRole(["admin"]), ClassController.CreateSubject);
router.post("/admin/update-subject", JWT.verifyToken, JWT.requireRole(["admin"]), ClassController.UpdateSubject);
router.get("/admin/class/:class_id/students", JWT.verifyToken, JWT.requireRole(["admin", "teacher"]), ClassController.GetClassStudents);

export default router;
