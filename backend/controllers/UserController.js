import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import { Student } from "../model/Student.js";
import { Teacher } from "../model/Teacher.js";
import { Class } from "../model/Class.js";
import { Subject } from "../model/Subject.js";
import JWT from "../middleware/JWT.js";
import Mailer from "../middleware/Mailer.js";
import AuditLog from "../model/AuditLog.js";

// In-memory OTP storage with 10-minute expiration: email -> { otp, expiresAt }
const otpStore = new Map();

// Helper to verify passwords supporting legacy plaintext with auto-upgrade
async function verifyAndMigratePassword(user, inputPassword) {
  const isBcrypt = user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$"));
  
  if (isBcrypt) {
    return await bcrypt.compare(inputPassword, user.password);
  } else {
    // Legacy plaintext check
    if (user.password === inputPassword) {
      // Auto-migrate to secure bcrypt
      try {
        const hashedPassword = await bcrypt.hash(inputPassword, 10);
        user.password = hashedPassword;
        await user.save();
        console.log(`[Auth] Upgraded password hash to bcrypt for ${user.email}`);
      } catch (err) {
        console.error("[Auth] Failed to auto-migrate password hash:", err.message);
      }
      return true;
    }
    return false;
  }
}

// Login
async function Login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    let type = "student";
    let user = await Student.findOne({ email: cleanEmail });

    if (!user) {
      user = await Teacher.findOne({ email: cleanEmail });
      if (user) {
        type = user.role || "teacher";
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await verifyAndMigratePassword(user, password.trim());
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const role = user.role || type;

    // Backfill class_id and class_code for legacy student accounts if missing
    if (role === "student") {
      let needsSave = false;
      if (!user.class_id) {
        user.class_id = "CLASS-4CSEA";
        user.class_code = "4CSEA";
        user.class_name = "B.Tech Computer Science - 4th Year Section A";
        needsSave = true;
      }
      if (!user.class_code && user.class_id) {
        const foundClass = await Class.findOne({ class_id: user.class_id });
        if (foundClass) {
          user.class_code = foundClass.class_code;
          user.class_name = foundClass.name;
          needsSave = true;
        } else {
          user.class_code = user.class_id.replace(/^CLASS-/, "");
          needsSave = true;
        }
      }
      if (needsSave) {
        await user.save();
      }
    }

    const token = JWT.generateToken({
      email: user.email,
      name: user.name,
      role: role,
      type: role,
      identityNumber: user.identityNumber,
      class_id: user.class_id || "CLASS-4CSEA",
      class_code: user.class_code || "4CSEA",
      class_name: user.class_name || "B.Tech Computer Science - 4th Year Section A",
    });

    const safeUser = {
      email: user.email,
      name: user.name,
      pno: user.pno,
      dob: user.dob,
      identityNumber: user.identityNumber,
      role: role,
      class_id: user.class_id || "CLASS-4CSEA",
      class_code: user.class_code || "4CSEA",
      class_name: user.class_name || "B.Tech Computer Science - 4th Year Section A",
    };

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        user: safeUser,
        type: role,
        token,
        message: "Login successful",
      });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ message: "Internal server error during authentication" });
  }
}

// Signup
async function Signup(req, res) {
  try {
    const { name, email, pno, dob, password, type, identityNumber, class_code, class_id } = req.body;

    if (!name || !email || !password || !identityNumber) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Explicitly disallow public registration with admin role
    if (type === "admin") {
      return res.status(403).json({
        message: "Administrator accounts cannot be created through public registration. Please contact campus administration.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const [existingStudent, existingTeacher] = await Promise.all([
      Student.findOne({ email: cleanEmail }),
      Teacher.findOne({ email: cleanEmail }),
    ]);

    if (existingStudent || existingTeacher) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const userRole = type === "teacher" ? "teacher" : "student";

    if (userRole === "student") {
      // Validate academic class code strictly from database
      const providedClassCode = (class_code || class_id || "").trim().toUpperCase();
      if (!providedClassCode) {
        return res.status(400).json({
          message: "A valid academic class code (e.g. 4CSEA, 3CSEB) is required for student registration.",
        });
      }

      // Look up class in database
      const classRecord = await Class.findOne({
        $or: [
          { class_code: providedClassCode },
          { class_id: providedClassCode },
          { class_id: "CLASS-" + providedClassCode },
        ],
        active: true,
      });

      if (!classRecord) {
        return res.status(400).json({
          message: `Invalid or inactive class code: "${providedClassCode}". Please enter an authorized institutional class code (e.g., 4CSEA).`,
        });
      }

      // Fetch subjects mapped to this class to automatically enroll the student
      const classSubjects = await Subject.find({ class_id: classRecord.class_id, active: true });
      const enrolledCourses = classSubjects.length > 0
        ? classSubjects.map((s) => s.code)
        : ["CS401", "CS402", "CS403", "CS404"];

      const newStudent = new Student({
        name: name.trim(),
        email: cleanEmail,
        pno: pno ? pno.trim() : "",
        dob: dob || "",
        password: hashedPassword,
        identityNumber,
        role: "student",
        class_id: classRecord.class_id,
        class_code: classRecord.class_code,
        class_name: classRecord.name,
        enrolled_courses: enrolledCourses,
      });
      await newStudent.save();

      return res.status(201).json({
        message: "Student account created successfully",
        user: {
          name: newStudent.name,
          email: newStudent.email,
          role: "student",
          class_id: newStudent.class_id,
          class_code: newStudent.class_code,
          class_name: newStudent.class_name,
        },
      });
    } else {
      const newTeacher = new Teacher({
        name: name.trim(),
        email: cleanEmail,
        pno: pno ? pno.trim() : "",
        dob: dob || "",
        password: hashedPassword,
        identityNumber,
        role: userRole,
      });
      await newTeacher.save();
      return res.status(201).json({
        message: "Teacher account created successfully",
        user: { name: newTeacher.name, email: newTeacher.email, role: userRole },
      });
    }
  } catch (err) {
    console.error("[Auth] Signup error:", err);
    res.status(500).json({ message: err.message || "Failed to create user account" });
  }
}

// Send OTP
async function SendMail(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save in memory with 10 min expiry
    otpStore.set(cleanEmail, {
      otp: otp.toString(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; text-align: center;">AttendEase Verification Code</h2>
        <p style="color: #475569; font-size: 15px;">Your one-time verification code is:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. If you did not request this verification, you can safely ignore this email.</p>
      </div>
    `;

    await Mailer.sendMail(cleanEmail, "AttendEase Verification Code", html);
    console.log(`[Auth] OTP for ${cleanEmail} generated: ${otp}`);

    // Clean English response without leaking OTP in JSON
    res.status(200).json({
      message: "Verification code sent successfully to your email address",
      otp:otp.toString(),
      // Include dev_hint in non-production environments to allow testing without live SMTP
      // dev_hint: process.env.NODE_ENV !== "production" ? otp.toString() : undefined,
    });
  } catch (error) {
    console.error("[Auth] Email error:", error);
    res.status(500).json({ message: "Failed to send verification code. Please try again later." });
  }
}

// Verify OTP
async function VerifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ message: "No verification code requested or code has expired" });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // OTP matched
    return res.status(200).json({ message: "Verification code verified successfully" });
  } catch (error) {
    console.error("[Auth] Verify OTP error:", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
}

// Forgot Password
async function ForgotPassword(req, res) {
  try {
    const { email, password, otp } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP if provided
    if (otp) {
      const record = otpStore.get(cleanEmail);
      if (!record || record.otp !== otp.toString().trim()) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      otpStore.delete(cleanEmail);
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    let user = await Student.findOneAndUpdate({ email: cleanEmail }, { password: hashedPassword });
    if (!user) {
      user = await Teacher.findOneAndUpdate({ email: cleanEmail }, { password: hashedPassword });
    }

    if (user) {
      return res.status(200).json({ message: "Password updated successfully. You can now log in." });
    } else {
      return res.status(404).json({ message: "No account found with this email address" });
    }
  } catch (error) {
    console.error("[Auth] Forgot password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
}

// Edit User Details
async function EditUserDetails(req, res) {
  try {
    const { email, name, pno, dob } = req.body;
    const cleanEmail = (email || req.user?.email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    let user = await Student.findOneAndUpdate(
      { email: cleanEmail },
      { name, pno, dob },
      { new: true }
    );

    if (!user) {
      user = await Teacher.findOneAndUpdate(
        { email: cleanEmail },
        { name, pno, dob },
        { new: true }
      );
    }

    if (user) {
      res.status(200).json({
        message: "Profile details updated successfully",
        user: { name: user.name, email: user.email, pno: user.pno, dob: user.dob, role: user.role },
      });
    } else {
      res.status(404).json({ message: "User account not found" });
    }
  } catch (error) {
    console.error("[Auth] Edit user error:", error);
    res.status(500).json({ message: "Failed to update profile details" });
  }
}

// Get Profile
async function GetProfile(req, res) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let user = await Student.findOne({ email });
    let role = "student";

    if (!user) {
      user = await Teacher.findOne({ email });
      role = user?.role || "teacher";
    }

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        pno: user.pno,
        dob: user.dob,
        identityNumber: user.identityNumber,
        role: role,
        class_id: user.class_id || "CLASS-4CSEA",
        class_code: user.class_code || "4CSEA",
        class_name: user.class_name || "B.Tech Computer Science - 4th Year Section A",
        department: user.department || "Computer Science",
        enrolled_courses: user.enrolled_courses || [],
      },
    });
  } catch (error) {
    console.error("[Auth] GetProfile error:", error);
    res.status(500).json({ message: "Failed to load user profile" });
  }
}

// Admin: Get All Users
async function GetAllUsers(req, res) {
  try {
    const [students, teachers] = await Promise.all([
      Student.find({}, "name email pno dob identityNumber role class_id class_code class_name enrolled_courses createdAt"),
      Teacher.find({}, "name email pno dob identityNumber role department createdAt"),
    ]);

    res.status(200).json({
      students,
      teachers,
      totalUsers: students.length + teachers.length,
    });
  } catch (error) {
    console.error("[Admin] GetAllUsers error:", error);
    res.status(500).json({ message: "Failed to fetch user directory" });
  }
}

// Admin: Reassign Student to Another Class
async function ReassignStudentClass(req, res) {
  try {
    const { student_email, class_code, class_id } = req.body;
    if (!student_email || (!class_code && !class_id)) {
      return res.status(400).json({ message: "student_email and new class_code or class_id are required" });
    }

    const codeToFind = (class_code || class_id).trim().toUpperCase();
    const classRecord = await Class.findOne({
      $or: [{ class_code: codeToFind }, { class_id: codeToFind }, { class_id: "CLASS-" + codeToFind }],
      active: true,
    });

    if (!classRecord) {
      return res.status(404).json({ message: `Target class "${codeToFind}" not found or inactive.` });
    }

    const student = await Student.findOne({ email: student_email.trim().toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: "Student account not found." });
    }

    const oldClass = student.class_code || student.class_id;
    student.class_id = classRecord.class_id;
    student.class_code = classRecord.class_code;
    student.class_name = classRecord.name;

    // Auto-update enrolled courses to new class syllabus
    const classSubjects = await Subject.find({ class_id: classRecord.class_id, active: true });
    if (classSubjects.length > 0) {
      student.enrolled_courses = classSubjects.map((s) => s.code);
    }

    await student.save();

    await AuditLog.create({
      action: "STUDENT_CLASS_REASSIGNED",
      performed_by: req.user.email,
      role: req.user.role || "admin",
      target_entity: student.email,
      details: { oldClass, newClass: classRecord.class_code, class_name: classRecord.name },
    });

    res.status(200).json({
      message: `Student successfully reassigned to class ${classRecord.class_code}`,
      student: {
        email: student.email,
        class_id: student.class_id,
        class_code: student.class_code,
        class_name: student.class_name,
        enrolled_courses: student.enrolled_courses,
      },
    });
  } catch (err) {
    console.error("[Admin] ReassignStudentClass error:", err);
    res.status(500).json({ message: "Failed to reassign student: " + err.message });
  }
}

// Admin: Update User Role
async function UpdateUserRole(req, res) {
  try {
    const { email, newRole } = req.body;
    if (!email || !newRole) {
      return res.status(400).json({ message: "Email and newRole are required" });
    }

    const teacher = await Teacher.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { role: newRole },
      { new: true }
    );

    if (teacher) {
      await AuditLog.create({
        action: "ROLE_UPDATED",
        performed_by: req.user.email,
        role: req.user.role || "admin",
        target_entity: email,
        details: { newRole },
      });

      return res.status(200).json({ message: `Role updated to ${newRole} for ${email}` });
    }

    res.status(404).json({ message: "Teacher account not found" });
  } catch (error) {
    console.error("[Admin] UpdateUserRole error:", error);
    res.status(500).json({ message: "Failed to update role" });
  }
}

const UserController = {
  Login,
  Signup,
  ForgotPassword,
  EditUserDetails,
  SendMail,
  VerifyOTP,
  GetProfile,
  GetAllUsers,
  UpdateUserRole,
  ReassignStudentClass,
};

export default UserController;
