import dotenv from "dotenv";
dotenv.config();
import querystring from "querystring";
import { Teacher } from "../model/Teacher.js";
import { Student } from "../model/Student.js";
import { AttendanceSession } from "../model/AttendanceSession.js";
import { AttendanceRecord } from "../model/AttendanceRecord.js";
import { Class } from "../model/Class.js";
import { Subject } from "../model/Subject.js";
import { AuditLog } from "../model/AuditLog.js";
import uploadImage from "../middleware/cloudinary.js";
import JWT from "../middleware/JWT.js";

// Haversine Distance in meters
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseCoordinates(coordString) {
  if (!coordString || typeof coordString !== "string") return null;
  const parts = coordString.split(",");
  if (parts.length < 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lon = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
}

function generateSessionQrUrl(sessionId, teacherEmail) {
  const qrToken = JWT.generateQrToken(sessionId, teacherEmail, 300); // 5-minute validity
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  return `${clientUrl}/login?${querystring.stringify({
    session_id: sessionId,
    email: teacherEmail,
    qr_token: qrToken,
  })}`;
}

// 1. Create New Session
async function CreateNewSession(req, res) {
  try {
    const {
      session_id,
      name,
      duration,
      location,
      radius,
      date,
      time,
      class_id,
      class_name,
      subject_id,
      subject_name,
      course_code,
      class_code
    } = req.body;
    const tokenData = req.user;

    if (!session_id || !name || !location) {
      return res.status(400).json({ message: "Session ID, name, and location are required" });
    }

    const coords = parseCoordinates(location);
    if (!coords) {
      return res.status(400).json({ message: "Invalid location coordinates. Expected format: 'latitude,longitude'" });
    }

    // Resolve Class Details
    let resolvedClassId = "CLASS-4CSEA";
    let resolvedClassCode = "4CSEA";
    let resolvedClassName = "B.Tech Computer Science - 4th Year Section A";

    const classLookup = class_code || class_id;
    if (classLookup) {
      const cleanLookup = classLookup.trim();
      const classDoc = await Class.findOne({
        $or: [
          { class_code: cleanLookup.toUpperCase() },
          { class_id: cleanLookup },
          { class_id: "CLASS-" + cleanLookup.toUpperCase() },
        ],
      });
      if (classDoc) {
        resolvedClassId = classDoc.class_id;
        resolvedClassCode = classDoc.class_code;
        resolvedClassName = classDoc.name;
      }
    }

    // Resolve Subject Details
    let resolvedSubjectId = subject_id;
    let resolvedSubjectName = subject_name || name;
    let resolvedCourseCode = course_code || "CS301";
    if (subject_id) {
      const subjectDoc = await Subject.findOne({ subject_id });
      if (subjectDoc) {
        resolvedSubjectId = subjectDoc.subject_id;
        resolvedSubjectName = subjectDoc.name;
        resolvedCourseCode = subjectDoc.code;
      }
    }

    const parsedRadius = parseFloat(radius) || 50;
    const sessionDate = date || new Date().toISOString().split("T")[0];
    const sessionTime = time || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    // 1. Save to AttendanceSession collection
    const newAttendanceSession = new AttendanceSession({
      session_id,
      teacher_email: tokenData.email,
      teacher_name: tokenData.name || "Faculty",
      class_id: resolvedClassId,
      class_code: resolvedClassCode,
      class_name: resolvedClassName,
      subject_id: resolvedSubjectId,
      course_code: resolvedCourseCode,
      subject_name: resolvedSubjectName,
      name,
      date: sessionDate,
      time: sessionTime,
      duration: duration || "60 mins",
      location,
      latitude: coords.lat,
      longitude: coords.lon,
      radius: parsedRadius,
      status: "active",
      qr_token_expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });
    await newAttendanceSession.save();

    // 2. Synchronize with legacy Teacher embedded sessions array
    const legacySession = {
      session_id,
      date: new Date(sessionDate),
      time: sessionTime,
      name,
      duration: duration || "60 mins",
      location,
      radius: parsedRadius.toString(),
      attendance: [],
    };

    await Teacher.findOneAndUpdate(
      { email: tokenData.email },
      { $push: { sessions: legacySession } }
    );

    const qrUrl = generateSessionQrUrl(session_id, tokenData.email);

    res.status(200).json({
      url: qrUrl,
      session_id,
      message: "Attendance session created successfully",
    });
  } catch (err) {
    console.error("[Session] Create session error:", err);
    res.status(500).json({ message: "Failed to create attendance session: " + err.message });
  }
}

// 2. Get Teacher Sessions
async function GetAllTeacherSessions(req, res) {
  try {
    const tokenData = req.user;
    
    // First query normalized collection
    let sessions = await AttendanceSession.find({ teacher_email: tokenData.email }).sort({ createdAt: -1 });

    // If normalized collection is empty, fallback to legacy Teacher.sessions
    if (!sessions || sessions.length === 0) {
      const teacher = await Teacher.findOne({ email: tokenData.email });
      sessions = (teacher?.sessions || []).map((s) => ({
        session_id: s.session_id,
        name: s.name,
        date: s.date ? new Date(s.date).toISOString().split("T")[0] : "",
        time: s.time,
        duration: s.duration,
        radius: s.radius,
        location: s.location,
        status: "active",
        attendance_count: s.attendance?.length || 0,
      }));
    }

    res.status(200).json({ sessions });
  } catch (err) {
    console.error("[Session] GetAllTeacherSessions error:", err);
    res.status(500).json({ message: "Failed to fetch sessions: " + err.message });
  }
}

// 3. Get QR for Session (with dynamic expiring token)
async function GetQR(req, res) {
  try {
    const tokenData = req.user;
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const session = await AttendanceSession.findOne({ session_id });
    if (session && session.status === "ended") {
      return res.status(400).json({ message: "This session has ended. Cannot generate QR." });
    }

    const url = generateSessionQrUrl(session_id, tokenData.email);
    res.status(200).json({ url, expires_in_seconds: 300 });
  } catch (err) {
    console.error("[Session] GetQR error:", err);
    res.status(500).json({ message: "Failed to generate QR: " + err.message });
  }
}

// 4. Update Session Status (Start, Pause, End)
async function UpdateSessionStatus(req, res) {
  try {
    const { session_id, status } = req.body;
    const tokenData = req.user;

    if (!session_id || !["active", "paused", "ended"].includes(status)) {
      return res.status(400).json({ message: "Valid session_id and status ('active', 'paused', 'ended') are required" });
    }

    const session = await AttendanceSession.findOneAndUpdate(
      { session_id, teacher_email: tokenData.email },
      { status },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found or not owned by requesting teacher" });
    }

    await AuditLog.create({
      action: "SESSION_STATUS_CHANGED",
      performed_by: tokenData.email,
      role: tokenData.role || "teacher",
      target_entity: session_id,
      details: { newStatus: status },
    });

    res.status(200).json({ message: `Session status updated to ${status}`, session });
  } catch (err) {
    console.error("[Session] UpdateSessionStatus error:", err);
    res.status(500).json({ message: "Failed to update session status" });
  }
}

// 5. Delete Session
async function deleteSession(req, res) {
  try {
    const { session_id } = req.body;
    const tokenData = req.user;

    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    // Delete from AttendanceSession & AttendanceRecord
    await Promise.all([
      AttendanceSession.deleteOne({ session_id, teacher_email: tokenData.email }),
      AttendanceRecord.deleteMany({ session_id }),
    ]);

    // Also remove from legacy Teacher model
    const teacher = await Teacher.findOne({ email: tokenData.email });
    if (teacher) {
      teacher.sessions = teacher.sessions.filter((s) => s.session_id !== session_id);
      await teacher.save();
    }

    await AuditLog.create({
      action: "SESSION_DELETED",
      performed_by: tokenData.email,
      role: tokenData.role || "teacher",
      target_entity: session_id,
      details: { session_id },
    });

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("[Session] Delete error:", error);
    res.status(500).json({ message: "Internal server error during session deletion" });
  }
}

// 6. Attend Session (Student Attendance Submission with Strict Geolocation Validation)
async function AttendSession(req, res) {
  try {
    const tokenData = req.user; // Authenticated student
    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Authentication required. Please sign in to submit attendance." });
    }

    const studentEmail = tokenData.email.trim().toLowerCase();
    const {
      session_id,
      teacher_email,
      IP,
      Location,
      date,
      qr_token,
    } = req.body;

    if (!session_id || !Location) {
      return res.status(400).json({ message: "Session ID and student geolocation coordinates are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Live camera photograph verification is required" });
    }

    // 1. Fetch authenticated student from database strictly - client cannot supply roll number or email
    const studentUser = await Student.findOne({ email: studentEmail });
    if (!studentUser) {
      return res.status(404).json({ message: "Student record not found in institutional database. Please contact campus administration." });
    }

    if (!studentUser.identityNumber) {
      return res.status(400).json({ message: "Student registration/roll number is not configured in your database profile. Please contact campus administration." });
    }

    const studentRegNo = studentUser.identityNumber.toString();
    const studentName = studentUser.name || "Student";

    // 2. Verify QR token if provided
    if (qr_token) {
      const decodedQr = JWT.verifyQrToken(qr_token);
      if (!decodedQr || decodedQr.sessionId !== session_id) {
        return res.status(403).json({ message: "Attendance QR code has expired or is invalid. Please ask the instructor to refresh the QR code." });
      }
    }

    // 3. Fetch Session from normalized AttendanceSession or legacy Teacher
    let session = await AttendanceSession.findOne({ session_id });
    let teacherLocationStr = session?.location;
    let allowedRadius = session?.radius || 50;

    if (!session) {
      const teacher = await Teacher.findOne({ email: teacher_email });
      const legacySession = teacher?.sessions?.find((s) => s.session_id === session_id);
      if (!legacySession) {
        return res.status(404).json({ message: "Attendance session not found" });
      }
      teacherLocationStr = legacySession.location;
      allowedRadius = parseFloat(legacySession.radius) || 50;
    } else {
      // Validate session status
      if (session.status === "paused") {
        return res.status(403).json({ message: "Attendance marking for this session is currently paused by the instructor." });
      }
      if (session.status === "ended") {
        return res.status(403).json({ message: "This attendance session has already ended. Submissions are no longer accepted." });
      }

      // 4. Validate Class Enrollment: Student must belong to the session's assigned class
      const sessionClassCode = session.class_code || session.class_id;
      const studentClassCode = studentUser.class_code || studentUser.class_id;
      const classMatches =
        (session.class_id && studentUser.class_id && session.class_id === studentUser.class_id) ||
        (session.class_code && studentUser.class_code && session.class_code.toUpperCase() === studentUser.class_code.toUpperCase()) ||
        (!session.class_id && !session.class_code);

      if (sessionClassCode && studentClassCode && !classMatches) {
        return res.status(403).json({
          message: `Attendance denied: You are not enrolled in the class for this session. This session is restricted to ${session.class_name || sessionClassCode}, but your registered class is ${studentUser.class_name || studentClassCode}.`,
        });
      }
    }

    // 5. Parse coordinates and calculate Haversine distance
    const studentCoords = parseCoordinates(Location);
    const teacherCoords = parseCoordinates(teacherLocationStr);

    if (!studentCoords || !teacherCoords) {
      return res.status(400).json({ message: "Invalid GPS coordinates received" });
    }

    const calculatedDistance = haversineDistance(
      studentCoords.lat,
      studentCoords.lon,
      teacherCoords.lat,
      teacherCoords.lon
    );

    const roundedDistance = parseFloat(calculatedDistance.toFixed(2));

    // 6. Strict Geolocation Radius Validation
    // Standard 5-meter buffer for typical mobile GPS accuracy fluctuation
    const effectiveRadius = allowedRadius + 5;
    const isWithinRadius = calculatedDistance <= effectiveRadius;

    if (!isWithinRadius) {
      return res.status(403).json({
        message: `Attendance denied: You are ${roundedDistance}m away, which exceeds the permitted radius of ${allowedRadius}m.`,
        distance: roundedDistance,
        allowedRadius,
      });
    }

    // 7. Prevent Duplicate Attendance (One attendance record per student per session)
    const existingRecord = await AttendanceRecord.findOne({
      session_id,
      student_email: studentEmail,
    });

    if (existingRecord) {
      return res.status(400).json({
        message: `Attendance has already been marked for this session on ${existingRecord.date} at ${existingRecord.time}. Duplicate submissions are prohibited.`,
        record: existingRecord,
      });
    }

    // 8. Upload photograph
    const imageName = req.file.filename;
    const photoUrl = await uploadImage(imageName);

    const attendanceDate = date || new Date().toISOString().split("T")[0];
    const attendanceTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    // 7. Save normalized AttendanceRecord
    const newRecord = new AttendanceRecord({
      session_id,
      student_email: studentEmail,
      student_name: studentName,
      regno: studentRegNo.toString(),
      teacher_email: teacher_email || session?.teacher_email,
      subject_name: session?.name || "Lecture Session",
      date: attendanceDate,
      time: attendanceTime,
      student_location: Location,
      student_latitude: studentCoords.lat,
      student_longitude: studentCoords.lon,
      distance: roundedDistance,
      allowed_radius: allowedRadius,
      status: "present",
      verification_status: "verified",
      image: photoUrl,
      ip_address: IP || req.ip || "0.0.0.0",
    });
    await newRecord.save();

    // Increment attendance count in AttendanceSession
    await AttendanceSession.findOneAndUpdate(
      { session_id },
      { $inc: { attendance_count: 1 } }
    );

    // 8. Backward Compatibility: Sync to legacy Teacher and Student documents
    const legacyTeacherEmail = teacher_email || session?.teacher_email;
    const teacherDoc = await Teacher.findOne({ email: legacyTeacherEmail });
    if (teacherDoc) {
      const teacherSession = teacherDoc.sessions.find((s) => s.session_id === session_id);
      if (teacherSession) {
        teacherSession.attendance.push({
          regno: studentRegNo.toString(),
          image: photoUrl,
          date: new Date(),
          IP: IP || "0.0.0.0",
          student_email: studentEmail,
          Location,
          distance: roundedDistance.toString(),
        });
        await teacherDoc.save();
      }
    }

    // Sync to Student sessions array
    const studentSessionDetail = {
      session_id,
      date: attendanceDate,
      time: attendanceTime,
      name: session?.name || "Lecture Session",
      duration: session?.duration || "60 mins",
      distance: roundedDistance.toString(),
      radius: allowedRadius.toString(),
      student_location: Location,
      image: photoUrl,
    };

    await Student.findOneAndUpdate(
      { email: studentEmail },
      { $push: { sessions: studentSessionDetail } }
    );

    return res.status(200).json({
      message: "Attendance marked successfully! Geolocation and photograph verified.",
      distance: roundedDistance,
      allowedRadius,
      record: newRecord,
    });
  } catch (err) {
    console.error("[Session] AttendSession Error:", err);
    return res.status(500).json({ message: "Failed to record attendance: " + err.message });
  }
}

// 7. Get Student Sessions (Attendance History)
async function GetStudentSessions(req, res) {
  try {
    const tokenData = req.user;
    const studentEmail = tokenData.email;

    // Fetch from normalized AttendanceRecord
    let records = await AttendanceRecord.find({ student_email: studentEmail }).sort({ createdAt: -1 });

    if (records && records.length > 0) {
      const formatted = records.map((r) => ({
        session_id: r.session_id,
        name: r.subject_name,
        date: r.date,
        time: r.time,
        duration: "60 mins",
        distance: r.distance.toString(),
        radius: r.allowed_radius.toString(),
        status: r.status,
        image: r.image,
      }));
      return res.status(200).json({ sessions: formatted });
    }

    // Fallback to Student document
    const student = await Student.findOne({ email: studentEmail });
    res.status(200).json({ sessions: student?.sessions || [] });
  } catch (err) {
    console.error("[Session] GetStudentSessions error:", err);
    res.status(500).json({ message: "Failed to retrieve student sessions: " + err.message });
  }
}

// 8. Get Session Attendance Details for Teacher
async function GetSessionDetails(req, res) {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const [session, records] = await Promise.all([
      AttendanceSession.findOne({ session_id }),
      AttendanceRecord.find({ session_id }).sort({ createdAt: -1 }),
    ]);

    if (!session) {
      // Legacy fallback
      const tokenData = req.user;
      const teacher = await Teacher.findOne({ email: tokenData.email });
      const legacySession = teacher?.sessions?.find((s) => s.session_id === session_id);
      if (!legacySession) {
        return res.status(404).json({ message: "Session not found" });
      }
      return res.status(200).json({ session: legacySession, records: legacySession.attendance || [] });
    }

    res.status(200).json({ session, records });
  } catch (err) {
    console.error("[Session] GetSessionDetails error:", err);
    res.status(500).json({ message: "Failed to fetch session details" });
  }
}

// 9. Correct Attendance Record (With mandatory reason & audit trail)
async function CorrectAttendance(req, res) {
  try {
    const { record_id, new_status, reason } = req.body;
    const tokenData = req.user;

    if (!record_id || !new_status || !reason) {
      return res.status(400).json({ message: "record_id, new_status, and mandatory reason are required" });
    }

    const record = await AttendanceRecord.findById(record_id);
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const oldStatus = record.status;
    record.status = new_status;
    record.verification_status = "manual_override";
    record.audit_history.push({
      previous_status: oldStatus,
      new_status,
      changed_by: tokenData.email,
      reason: reason.trim(),
      timestamp: new Date(),
    });
    await record.save();

    await AuditLog.create({
      action: "ATTENDANCE_CORRECTED",
      performed_by: tokenData.email,
      role: tokenData.role || "teacher",
      target_entity: record_id,
      details: { previousStatus: oldStatus, newStatus: new_status, reason: reason.trim() },
    });

    res.status(200).json({ message: "Attendance record updated successfully", record });
  } catch (err) {
    console.error("[Session] CorrectAttendance error:", err);
    res.status(500).json({ message: "Failed to update attendance record" });
  }
}

// 10. Export Session Attendance Report (CSV)
async function ExportSessionAttendance(req, res) {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).send("session_id parameter is required");
    }

    const [session, records] = await Promise.all([
      AttendanceSession.findOne({ session_id }),
      AttendanceRecord.find({ session_id }),
    ]);

    let csv = "Registration Number,Student Name,Email,Date,Time,Distance (m),Allowed Radius (m),Status,Verification\n";
    for (const r of records) {
      csv += `"${r.regno}","${r.student_name}","${r.student_email}","${r.date}","${r.time}",${r.distance},${r.allowed_radius},"${r.status}","${r.verification_status}"\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=attendance-${session_id}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    console.error("[Session] ExportSessionAttendance error:", err);
    res.status(500).send("Failed to export attendance CSV");
  }
}

// 11. Verify Session Eligibility for Student Access (URL or QR Scan)
async function VerifySessionEligibility(req, res) {
  try {
    const tokenData = req.user;
    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Authentication required to access attendance session" });
    }

    const { session_id, qr_token } = req.body;
    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const studentUser = await Student.findOne({ email: tokenData.email.trim().toLowerCase() });
    if (!studentUser) {
      return res.status(404).json({ message: "Student profile not found in database" });
    }

    let session = await AttendanceSession.findOne({ session_id });
    if (!session) {
      // Legacy fallback
      const teacher = await Teacher.findOne({ "sessions.session_id": session_id });
      const legacySession = teacher?.sessions?.find((s) => s.session_id === session_id);
      if (!legacySession) {
        return res.status(404).json({ message: "Attendance session not found or has been removed." });
      }
      session = {
        session_id: legacySession.session_id,
        name: legacySession.name,
        subject_name: legacySession.name,
        course_code: "CS301",
        class_id: studentUser.class_id || "CLASS-CS3A",
        class_name: studentUser.class_name || "B.Tech Computer Science - 3rd Year Section A",
        duration: legacySession.duration,
        radius: parseFloat(legacySession.radius) || 50,
        status: "active",
      };
    }

    // Check status
    if (session.status === "paused") {
      return res.status(403).json({
        eligible: false,
        code: "SESSION_PAUSED",
        message: "Attendance marking for this session is currently paused by the instructor.",
      });
    }
    if (session.status === "ended") {
      return res.status(403).json({
        eligible: false,
        code: "SESSION_ENDED",
        message: "This attendance session has already ended. Submissions are no longer accepted.",
      });
    }

    // Check class enrollment
    const sessionClassCode = session.class_code || session.class_id;
    const studentClassCode = studentUser.class_code || studentUser.class_id;
    const classMatches =
      (session.class_id && studentUser.class_id && session.class_id === studentUser.class_id) ||
      (session.class_code && studentUser.class_code && session.class_code.toUpperCase() === studentUser.class_code.toUpperCase()) ||
      (!session.class_id && !session.class_code);

    if (sessionClassCode && studentClassCode && !classMatches) {
      return res.status(403).json({
        eligible: false,
        code: "NOT_ENROLLED",
        message: `You are not enrolled in the class for this session. This session is designated for ${session.class_name || sessionClassCode}, but you are registered in ${studentUser.class_name || studentClassCode}.`,
      });
    }

    // Check QR token if provided
    if (qr_token) {
      const decodedQr = JWT.verifyQrToken(qr_token);
      if (!decodedQr || decodedQr.sessionId !== session_id) {
        return res.status(403).json({
          eligible: false,
          code: "QR_EXPIRED",
          message: "Attendance QR code token has expired or is invalid. Please request a refreshed code from your instructor.",
        });
      }
    }

    // Check if already marked attendance
    const existing = await AttendanceRecord.findOne({
      session_id,
      student_email: studentUser.email,
    });

    if (existing) {
      return res.status(400).json({
        eligible: false,
        code: "ALREADY_ATTENDED",
        message: `You have already marked attendance for this session on ${existing.date} at ${existing.time}.`,
        record: existing,
      });
    }

    return res.status(200).json({
      eligible: true,
      session: {
        session_id: session.session_id,
        name: session.name,
        subject_name: session.subject_name,
        course_code: session.course_code,
        class_id: session.class_id,
        class_code: session.class_code || studentUser.class_code,
        class_name: session.class_name,
        radius: session.radius,
        duration: session.duration,
      },
      student: {
        name: studentUser.name,
        email: studentUser.email,
        regno: studentUser.identityNumber,
        class_id: studentUser.class_id,
        class_code: studentUser.class_code,
        class_name: studentUser.class_name,
      },
    });
  } catch (err) {
    console.error("[Session] VerifySessionEligibility error:", err);
    res.status(500).json({ message: "Failed to verify session eligibility: " + err.message });
  }
}

// 12. Get Active Sessions (Class-Based Visibility for Students; Faculty see their created sessions)
async function GetActiveSessions(req, res) {
  try {
    const tokenData = req.user;
    if (!tokenData) {
      return res.status(401).json({ message: "Authentication required", sessions: [] });
    }

    const role = (tokenData.role || tokenData.type || "").toLowerCase();

    // 1. Student: Only discover active sessions belonging to their assigned class
    if (role === "student") {
      const student = await Student.findOne({ email: tokenData.email.trim().toLowerCase() });
      if (!student) {
        return res.status(404).json({ message: "Student record not found", sessions: [] });
      }

      const studentClassId = student.class_id;
      const studentClassCode = student.class_code;

      if (!studentClassId && !studentClassCode) {
        return res.status(200).json({ sessions: [] });
      }

      const classFilter = [];
      if (studentClassId) classFilter.push({ class_id: studentClassId });
      if (studentClassCode) classFilter.push({ class_code: studentClassCode });

      const activeSessions = await AttendanceSession.find({
        status: "active",
        $or: classFilter,
      }).sort({ createdAt: -1 });

      const sessionIds = activeSessions.map((s) => s.session_id);
      const studentRecords = await AttendanceRecord.find({
        session_id: { $in: sessionIds },
        student_email: student.email,
      });
      const attendedSet = new Set(studentRecords.map((r) => r.session_id));

      const formatted = activeSessions.map((s) => {
        const alreadyAttended = attendedSet.has(s.session_id);
        return {
          session_id: s.session_id,
          name: s.name,
          subject_name: s.subject_name,
          course_code: s.course_code,
          class_id: s.class_id,
          class_code: s.class_code || studentClassCode,
          class_name: s.class_name,
          teacher_name: s.teacher_name || "Faculty",
          teacher_email: s.teacher_email,
          date: s.date,
          time: s.time,
          duration: s.duration,
          radius: s.radius,
          status: s.status,
          already_attended: alreadyAttended,
          attendance_status: alreadyAttended ? "Marked" : "Active - Pending",
        };
      });

      return res.status(200).json({ sessions: formatted });
    }

    // 2. Faculty: See active sessions created by this instructor
    if (role === "teacher") {
      const activeSessions = await AttendanceSession.find({
        teacher_email: tokenData.email,
        status: "active",
      })
        .select("session_id name class_code class_id class_name subject_name course_code date time duration radius status attendance_count")
        .sort({ createdAt: -1 });

      return res.status(200).json({ sessions: activeSessions });
    }

    // 3. Admin: See all active institutional sessions
    const allActive = await AttendanceSession.find({ status: "active" })
      .select("session_id name class_code class_id class_name subject_name course_code teacher_name teacher_email date time duration radius status attendance_count")
      .sort({ createdAt: -1 });

    res.status(200).json({ sessions: allActive });
  } catch (err) {
    console.error("[Session] GetActiveSessions error:", err);
    res.status(500).json({ message: "Failed to fetch active sessions: " + err.message });
  }
}

const SessionController = {
  CreateNewSession,
  GetAllTeacherSessions,
  GetQR,
  UpdateSessionStatus,
  deleteSession,
  AttendSession,
  GetStudentSessions,
  GetSessionDetails,
  CorrectAttendance,
  ExportSessionAttendance,
  VerifySessionEligibility,
  GetActiveSessions,
};

export default SessionController;
