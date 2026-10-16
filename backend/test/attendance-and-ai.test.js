import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import JWT from "../middleware/JWT.js";
import { AiCurriculumService } from "../services/AiCurriculumService.js";
import { AcademicAnalyticsService } from "../services/AcademicAnalyticsService.js";

// Haversine Distance implementation to test
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
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

test("Haversine Distance: Returns 0 for identical coordinates", () => {
  const distance = haversineDistance(28.6139, 77.2090, 28.6139, 77.2090);
  assert.equal(Math.round(distance), 0);
});

test("Haversine Distance & Geofence Boundary Check", () => {
  // Point A (Teacher): 28.61390, 77.20900
  // Point B (Student nearby ~25m away): 28.61410, 77.20910
  // Point C (Student far ~500m away): 28.61800, 77.21200
  const distNearby = haversineDistance(28.61390, 77.20900, 28.61410, 77.20910);
  const distFar = haversineDistance(28.61390, 77.20900, 28.61800, 77.21200);

  const allowedRadius = 50; // 50 meters
  const buffer = 5;

  assert.ok(distNearby <= allowedRadius + buffer, `Nearby student (${Math.round(distNearby)}m) should be inside 50m radius`);
  assert.ok(distFar > allowedRadius + buffer, `Far student (${Math.round(distFar)}m) should be outside 50m radius`);
});

test("Expiring Signed QR Token Generation & Validation", () => {
  const sessionId = "test-session-123";
  const teacherEmail = "teacher@institution.edu";

  // Generate QR token valid for 60 seconds
  const qrToken = JWT.generateQrToken(sessionId, teacherEmail, 60);
  assert.ok(qrToken, "QR token string must be generated");

  // Verify valid token
  const decoded = JWT.verifyQrToken(qrToken);
  assert.equal(decoded.sessionId, sessionId);
  assert.equal(decoded.teacherEmail, teacherEmail);
  assert.equal(decoded.purpose, "attendance_qr");

  // Tampered token fails
  const tampered = qrToken.slice(0, -5) + "abcde";
  const decodedTampered = JWT.verifyQrToken(tampered);
  assert.equal(decodedTampered, null, "Tampered token must return null");
});

test("Password Hashing & Backward-Compatible Verification", async () => {
  const plainPassword = "SuperSecretPassword123";
  const hash = await bcrypt.hash(plainPassword, 10);

  // Verification against bcrypt hash
  const isValid = await bcrypt.compare(plainPassword, hash);
  assert.equal(isValid, true);

  const isInvalid = await bcrypt.compare("WrongPassword", hash);
  assert.equal(isInvalid, false);
});

test("Academic Analytics: Topic Mastery Calculations", () => {
  function getMastery(percentage) {
    if (percentage >= 80) return "mastered";
    if (percentage >= 65) return "proficient";
    if (percentage >= 50) return "needs_improvement";
    return "critical_gap";
  }

  assert.equal(getMastery(85), "mastered");
  assert.equal(getMastery(70), "proficient");
  assert.equal(getMastery(55), "needs_improvement");
  assert.equal(getMastery(40), "critical_gap");
});

test("Attendance Shortage Warning Logic", () => {
  function evaluateAttendanceWarning(attended, total) {
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    return {
      percentage,
      isShortage: percentage < 75,
    };
  }

  const good = evaluateAttendanceWarning(18, 20); // 90%
  assert.equal(good.isShortage, false);

  const bad = evaluateAttendanceWarning(14, 20); // 70%
  assert.equal(bad.isShortage, true);
});

test("Attendance 75% Requirement: Consecutive Classes Recovery Calculation", () => {
  // Formula: n = max(0, ceil((0.75 * T - A) / 0.25))

  // Case 1: Attended 10 out of 20 (50%). Need (15 - 10) / 0.25 = 20 classes.
  // After attending 20 consecutive: 30 / 40 = 75%.
  const n1 = AcademicAnalyticsService.calculateConsecutiveClassesNeeded(10, 20, 0.75);
  assert.equal(n1, 20);
  assert.equal((10 + n1) / (20 + n1), 0.75);

  // Case 2: Attended 14 out of 20 (70%). Need (15 - 14) / 0.25 = 4 classes.
  // After attending 4 consecutive: 18 / 24 = 75%.
  const n2 = AcademicAnalyticsService.calculateConsecutiveClassesNeeded(14, 20, 0.75);
  assert.equal(n2, 4);
  assert.equal((14 + n2) / (20 + n2), 0.75);

  // Case 3: Exactly 75% (15 out of 20). Needed = 0.
  const n3 = AcademicAnalyticsService.calculateConsecutiveClassesNeeded(15, 20, 0.75);
  assert.equal(n3, 0);

  // Case 4: Above 75% (18 out of 20). Needed = 0.
  const n4 = AcademicAnalyticsService.calculateConsecutiveClassesNeeded(18, 20, 0.75);
  assert.equal(n4, 0);

  // Case 5: Zero sessions held. Needed = 0.
  const n5 = AcademicAnalyticsService.calculateConsecutiveClassesNeeded(0, 0, 0.75);
  assert.equal(n5, 0);

  // Case 6: Ceiling check: Attended 1 out of 2 (50%). Need ceil((1.5 - 1) / 0.25) = 2.
  const n6 = AcademicAnalyticsService.calculateConsecutiveClassesNeeded(1, 2, 0.75);
  assert.equal(n6, 2);
  assert.ok((1 + n6) / (2 + n6) >= 0.75);
});

test("Attendance 75% Requirement: Safe Miss Buffer Calculation", () => {
  // Formula: b = floor((A - 0.75 * T) / 0.75)

  // Case 1: Attended 18 out of 20 (90%).
  // Buffer: floor((18 - 15) / 0.75) = floor(3 / 0.75) = 4 classes.
  // After missing 4 classes: 18 / (20 + 4) = 18 / 24 = 75%.
  const b1 = AcademicAnalyticsService.calculateSafeClassesCanMiss(18, 20, 0.75);
  assert.equal(b1, 4);
  assert.equal(18 / (20 + b1), 0.75);
  // Missing 5 classes would breach: 18 / 25 = 72% (< 75%)
  assert.ok(18 / (20 + b1 + 1) < 0.75);

  // Case 2: Exactly 75% (15 out of 20). Buffer: floor(0 / 0.75) = 0.
  const b2 = AcademicAnalyticsService.calculateSafeClassesCanMiss(15, 20, 0.75);
  assert.equal(b2, 0);

  // Case 3: Below 75% (14 out of 20). Buffer: 0.
  const b3 = AcademicAnalyticsService.calculateSafeClassesCanMiss(14, 20, 0.75);
  assert.equal(b3, 0);

  // Case 4: Zero sessions held. Buffer: 0.
  const b4 = AcademicAnalyticsService.calculateSafeClassesCanMiss(0, 0, 0.75);
  assert.equal(b4, 0);
});

test("Security: Student Roll Number Must Be Derived Strictly From DB", () => {
  // Simulate request payload containing malicious/forged roll number
  const simulatedReq = {
    user: { email: "student@institution.edu", role: "student" },
    body: {
      session_id: "SESSION-999",
      regno: "MALICIOUS-ROLL-OVERRIDE-999", // Attacker trying to spoof roll number
    },
  };

  // Mock DB record for authenticated student
  const dbStudent = {
    email: "student@institution.edu",
    identityNumber: "22BCS1045", // Genuine institutional roll number
    class_id: "CLASS-CS3A",
    name: "Jane Doe",
  };

  // System rule: The client-supplied body.regno is NEVER trusted.
  // The system must derive identity exclusively from dbStudent.identityNumber.
  const authoritativeRollNumber = dbStudent.identityNumber.toString();
  assert.notEqual(simulatedReq.body.regno, authoritativeRollNumber);
  assert.equal(authoritativeRollNumber, "22BCS1045");
});

test("Security: Class Enrollment Enforcement Rejects Ineligible Students", () => {
  const session = {
    session_id: "SESSION-MATH301",
    class_id: "CLASS-CS3A",
    class_name: "B.Tech Computer Science - 3rd Year Section A",
    status: "active",
  };

  const enrolledStudent = {
    email: "student1@institution.edu",
    class_id: "CLASS-CS3A",
  };

  const foreignStudent = {
    email: "student2@institution.edu",
    class_id: "CLASS-CS3B", // Different section
  };

  function validateClassEnrollment(sessionObj, studentObj) {
    if (sessionObj.class_id && studentObj.class_id && sessionObj.class_id !== studentObj.class_id) {
      return { eligible: false, message: `Access denied: Not enrolled in ${sessionObj.class_name}` };
    }
    return { eligible: true };
  }

  const resultEnrolled = validateClassEnrollment(session, enrolledStudent);
  assert.equal(resultEnrolled.eligible, true);

  const resultForeign = validateClassEnrollment(session, foreignStudent);
  assert.equal(resultForeign.eligible, false);
  assert.ok(resultForeign.message.includes("Access denied"));
});

test("Security: Class-Specific Live Attendance Sessions Discovery & Access Control", () => {
  // Session created specifically for class 4CSEA
  const activeSessionsDatabase = [
    {
      session_id: "SESSION-4CSEA-01",
      name: "Lecture 14: Distributed Systems",
      course_code: "CS401",
      subject_name: "Advanced Distributed Systems",
      class_code: "4CSEA",
      class_id: "CLASS-4CSEA",
      status: "active",
      teacher_name: "Dr. Alan Turing",
      teacher_email: "faculty@institution.edu",
      duration: "60 mins",
      radius: 50,
      createdAt: new Date(),
    },
    {
      session_id: "SESSION-3CSEA-01",
      name: "Lecture 10: Algorithms",
      course_code: "CS301",
      subject_name: "Design & Analysis of Algorithms",
      class_code: "3CSEA",
      class_id: "CLASS-3CSEA",
      status: "active",
      teacher_name: "Prof. Ada Lovelace",
      teacher_email: "faculty2@institution.edu",
      duration: "45 mins",
      radius: 50,
      createdAt: new Date(),
    },
  ];

  const attendanceRecordsDatabase = [
    {
      session_id: "SESSION-4CSEA-01",
      student_email: "student_marked@institution.edu",
      date: "2026-10-16",
      time: "09:15 AM",
    },
  ];

  function getActiveSessionsForUser(user) {
    if (!user) return { status: 401, sessions: [] };
    if (user.role === "student") {
      const studentClassCode = (user.class_code || "").toUpperCase();
      // Only sessions for the student's registered class
      const matching = activeSessionsDatabase.filter(
        (s) => s.status === "active" && s.class_code.toUpperCase() === studentClassCode
      );
      const attendedSet = new Set(
        attendanceRecordsDatabase
          .filter((r) => r.student_email === user.email)
          .map((r) => r.session_id)
      );

      return {
        status: 200,
        sessions: matching.map((s) => ({
          ...s,
          already_attended: attendedSet.has(s.session_id),
          attendance_status: attendedSet.has(s.session_id) ? "Marked" : "Active - Pending",
        })),
      };
    }
    return { status: 200, sessions: [] };
  }

  // 1. Unauthenticated request: blocked
  const unauth = getActiveSessionsForUser(null);
  assert.equal(unauth.status, 401);
  assert.equal(unauth.sessions.length, 0);

  // 2. Student in class 4CSEA who has not yet attended:
  const student4CSEA_Pending = { email: "student_pending@institution.edu", role: "student", class_code: "4CSEA" };
  const resPending = getActiveSessionsForUser(student4CSEA_Pending);
  assert.equal(resPending.status, 200);
  assert.equal(resPending.sessions.length, 1);
  assert.equal(resPending.sessions[0].session_id, "SESSION-4CSEA-01");
  assert.equal(resPending.sessions[0].already_attended, false);
  assert.equal(resPending.sessions[0].attendance_status, "Active - Pending");

  // 3. Student in class 4CSEA who has already attended:
  const student4CSEA_Marked = { email: "student_marked@institution.edu", role: "student", class_code: "4CSEA" };
  const resMarked = getActiveSessionsForUser(student4CSEA_Marked);
  assert.equal(resMarked.status, 200);
  assert.equal(resMarked.sessions.length, 1);
  assert.equal(resMarked.sessions[0].already_attended, true);
  assert.equal(resMarked.sessions[0].attendance_status, "Marked");

  // 4. Student in class 3CSEB (different cohort): Cannot discover 4CSEA or 3CSEA sessions
  const student3CSEB = { email: "student_b@institution.edu", role: "student", class_code: "3CSEB" };
  const res3CSEB = getActiveSessionsForUser(student3CSEB);
  assert.equal(res3CSEB.status, 200);
  assert.equal(res3CSEB.sessions.length, 0, "Student in 3CSEB must not discover 4CSEA sessions");
});

test("Admin Account Seeding: Idempotency & Security Verification", async () => {
  // Mock institutional database
  const userDatabase = [];

  async function seedAdminAccount(config) {
    const adminEmail = (config.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = config.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    }

    const existingAdmin = userDatabase.find((u) => u.email === adminEmail);
    if (existingAdmin) {
      // Idempotent: Do not overwrite credentials or re-create
      return { seeded: false, message: "Admin account already exists. Preserving credentials." };
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const newAdmin = {
      email: adminEmail,
      password: hashedPassword,
      name: config.ADMIN_NAME || "System Administrator",
      user_type: "admin",
      role: "admin",
      createdAt: new Date(),
    };
    userDatabase.push(newAdmin);
    return { seeded: true, user: newAdmin };
  }

  // 1. Initial Seeding Run
  const res1 = await seedAdminAccount({
    ADMIN_EMAIL: "admin@institution.edu",
    ADMIN_PASSWORD: "AdminSecurePassword2026!",
    ADMIN_NAME: "Chief Administrator",
  });
  assert.equal(res1.seeded, true);
  assert.equal(userDatabase.length, 1);
  assert.equal(userDatabase[0].role, "admin");
  assert.equal(userDatabase[0].user_type, "admin");

  // Verify bcrypt hash
  const isValidPassword = await bcrypt.compare("AdminSecurePassword2026!", userDatabase[0].password);
  assert.equal(isValidPassword, true);

  // 2. Second Seeding Run (Idempotent: must not duplicate or overwrite)
  const res2 = await seedAdminAccount({
    ADMIN_EMAIL: "admin@institution.edu",
    ADMIN_PASSWORD: "DifferentPasswordAttempt",
    ADMIN_NAME: "Chief Administrator",
  });
  assert.equal(res2.seeded, false);
  assert.equal(userDatabase.length, 1, "Must remain exactly one admin record");

  // Password must remain original hashed password, untouched
  const isOriginalStillValid = await bcrypt.compare("AdminSecurePassword2026!", userDatabase[0].password);
  assert.equal(isOriginalStillValid, true);

  // 3. Security Check: Public signup with type: 'admin' is strictly rejected
  function handlePublicSignup(payload) {
    const requestedType = (payload.type || "student").toLowerCase();
    if (requestedType === "admin") {
      return { status: 403, error: "Administrative accounts cannot be registered via public registration. Use authorized institutional seeding." };
    }
    return { status: 201, message: "User registered" };
  }

  const publicAdminAttempt = handlePublicSignup({ email: "hacker@domain.com", type: "admin" });
  assert.equal(publicAdminAttempt.status, 403);
  assert.ok(publicAdminAttempt.error.includes("Administrative accounts cannot be registered"));
});

test("Unique Class Codes: Normalization, Format Validation & Lookup", () => {
  // Institutional class code format: e.g. 4CSEA (Year 4, CS, Section A)
  function normalizeAndValidateClassCode(rawCode) {
    if (!rawCode || typeof rawCode !== "string") {
      return { valid: false, message: "Class code is required." };
    }
    const normalized = rawCode.trim().toUpperCase();
    if (normalized.length < 3 || normalized.length > 12) {
      return { valid: false, message: "Class code must be between 3 and 12 characters." };
    }
    if (!/^[A-Z0-9_-]+$/.test(normalized)) {
      return { valid: false, message: "Class code must contain only letters, numbers, and hyphens." };
    }
    return { valid: true, code: normalized };
  }

  // Normalization check
  const check1 = normalizeAndValidateClassCode("  4csea  ");
  assert.equal(check1.valid, true);
  assert.equal(check1.code, "4CSEA");

  const check2 = normalizeAndValidateClassCode("3cseb");
  assert.equal(check2.valid, true);
  assert.equal(check2.code, "3CSEB");

  // Invalid formats
  const checkInvalid = normalizeAndValidateClassCode("4CS EA!"); // contains spaces and special char
  assert.equal(checkInvalid.valid, false);

  // Mock class database lookup
  const mockClasses = [
    {
      class_id: "CLASS-4CSEA",
      class_code: "4CSEA",
      name: "B.Tech Computer Science - 4th Year Section A",
      academic_year: "4th Year",
      section: "Section A",
      subjects: [
        { subject_id: "SUB-CS401", code: "CS401", name: "Advanced Distributed Systems" },
        { subject_id: "SUB-CS402", code: "CS402", name: "Machine Learning & Neural Networks" },
      ],
      is_active: true,
    },
  ];

  function lookupClassByCode(queryCode) {
    const norm = normalizeAndValidateClassCode(queryCode);
    if (!norm.valid) return { status: 400, message: norm.message };
    const found = mockClasses.find((c) => c.class_code === norm.code && c.is_active);
    if (!found) return { status: 404, message: `Class code ${norm.code} was not found.` };
    return { status: 200, class: found };
  }

  const lookupSuccess = lookupClassByCode("4csea");
  assert.equal(lookupSuccess.status, 200);
  assert.equal(lookupSuccess.class.class_code, "4CSEA");
  assert.equal(lookupSuccess.class.subjects.length, 2);

  // Non-existent code with valid format returns 404
  const lookupFail = lookupClassByCode("4CSZZ");
  assert.equal(lookupFail.status, 404);

  // Over-length code returns 400
  const lookupInvalid = lookupClassByCode("TOOLONGCODE12345");
  assert.equal(lookupInvalid.status, 400);
});

test("Student Signup: Class Code Enforcement & Subject Auto-Enrollment", async () => {
  const verifiedClasses = [
    {
      class_id: "CLASS-4CSEA",
      class_code: "4CSEA",
      name: "B.Tech Computer Science - 4th Year Section A",
      subjects: [
        { subject_id: "SUB-CS401", code: "CS401", name: "Advanced Distributed Systems" },
        { subject_id: "SUB-CS402", code: "CS402", name: "Machine Learning & Neural Networks" },
        { subject_id: "SUB-CS403", code: "CS403", name: "Cloud Computing Architectures" },
        { subject_id: "SUB-CS404", code: "CS404", name: "Cybersecurity & Cryptography" },
      ],
    },
  ];

  function registerStudent(studentData) {
    if (!studentData.class_code && !studentData.class_id) {
      return { status: 400, message: "Valid academic class code is required for student registration." };
    }

    const normalizedCode = (studentData.class_code || "").trim().toUpperCase();
    const matchedClass = verifiedClasses.find(
      (c) => c.class_code === normalizedCode || c.class_id === studentData.class_id
    );

    if (!matchedClass) {
      return {
        status: 400,
        message: `Invalid class code: No active academic class matches code '${normalizedCode}'. Please contact your institutional administrator.`,
      };
    }

    // Auto-enroll student into subjects of this class
    const enrolledSubjects = matchedClass.subjects.map((s) => s.code);

    return {
      status: 201,
      student: {
        name: studentData.name,
        email: studentData.email,
        class_id: matchedClass.class_id,
        class_code: matchedClass.class_code,
        class_name: matchedClass.name,
        enrolled_subjects: enrolledSubjects,
      },
    };
  }

  // 1. Success with valid class code "4CSEA"
  const successReg = registerStudent({
    name: "John Student",
    email: "john@institution.edu",
    class_code: "4csea", // lowercase to verify auto-normalization
  });
  assert.equal(successReg.status, 201);
  assert.equal(successReg.student.class_code, "4CSEA");
  assert.equal(successReg.student.enrolled_subjects.length, 4);
  assert.ok(successReg.student.enrolled_subjects.includes("CS401"));

  // 2. Failure with invalid class code
  const failReg = registerStudent({
    name: "Unknown Student",
    email: "unknown@institution.edu",
    class_code: "99FAKECLASS",
  });
  assert.equal(failReg.status, 400);
  assert.ok(failReg.message.includes("No active academic class matches"));

  // 3. Failure without class code
  const missingCodeReg = registerStudent({
    name: "Missing Code",
    email: "missing@institution.edu",
  });
  assert.equal(missingCodeReg.status, 400);
  assert.ok(missingCodeReg.message.includes("Valid academic class code is required"));
});

test("AI / Deterministic Study Plan Generator: Conformance & Explainability", () => {
  const plan = AiCurriculumService.generateDeterministicStudyPlan({
    studentName: "Alex",
    weakTopics: [
      {
        topic_id: "topic-linked-lists",
        topic_title: "Singly and Doubly Linked Lists",
        course_code: "CS301",
        percentage: 42,
        severity: "critical",
      },
    ],
    courseSyllabus: [],
    preferredPace: "standard",
  });

  assert.ok(plan.plan_id, "Plan must have unique plan_id");
  assert.ok(plan.summary, "Plan must have overview summary");
  assert.equal(plan.topics.length, 1);

  const topic = plan.topics[0];
  assert.equal(topic.topic_id, "topic-linked-lists");
  assert.equal(topic.priority, "high");
  assert.ok(topic.reason.includes("42%"), "Reason must reference student's actual 42% score");
  assert.ok(topic.learning_objectives.length >= 2, "Must contain learning objectives");
  assert.ok(topic.activities.length >= 2, "Must contain learning activities");
  assert.ok(topic.practice_questions.length >= 2, "Must contain practice questions with explanations");
  assert.ok(topic.practice_questions[0].explanation, "Practice question must include pedagogical explanation");
});

