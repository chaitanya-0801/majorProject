import { Class } from "../model/Class.js";
import { Subject } from "../model/Subject.js";
import { Student } from "../model/Student.js";
import { AuditLog } from "../model/AuditLog.js";

/**
 * Seed default institutional classes and subject mappings if database has none
 */
/**
 * Seed default institutional classes and subject mappings if database has none
 */
export async function seedDefaultClassesAndSubjectsIfEmpty() {
  try {
    const defaultClasses = [
      {
        class_id: "CLASS-4CSEA",
        class_code: "4CSEA",
        name: "B.Tech Computer Science - 4th Year Section A",
        department: "Computer Science & Engineering",
        academic_year: "4",
        section: "A",
        semester: 7,
        active: true,
      },
      {
        class_id: "CLASS-CS3A",
        class_code: "3CSEA",
        name: "B.Tech Computer Science - 3rd Year Section A",
        department: "Computer Science & Engineering",
        academic_year: "3",
        section: "A",
        semester: 5,
        active: true,
      },
      {
        class_id: "CLASS-CS3B",
        class_code: "3CSEB",
        name: "B.Tech Computer Science - 3rd Year Section B",
        department: "Computer Science & Engineering",
        academic_year: "3",
        section: "B",
        semester: 5,
        active: true,
      },
      {
        class_id: "CLASS-IT3A",
        class_code: "3ITA",
        name: "B.Tech Information Technology - 3rd Year Section A",
        department: "Information Technology",
        academic_year: "3",
        section: "A",
        semester: 5,
        active: true,
      },
      {
        class_id: "CLASS-2CSEA",
        class_code: "2CSEA",
        name: "B.Tech Computer Science - 2nd Year Section A",
        department: "Computer Science & Engineering",
        academic_year: "2",
        section: "A",
        semester: 3,
        active: true,
      },
      {
        class_id: "CLASS-1CSEA",
        class_code: "1CSEA",
        name: "B.Tech Computer Science - 1st Year Section A",
        department: "Computer Science & Engineering",
        academic_year: "1",
        section: "A",
        semester: 1,
        active: true,
      },
    ];

    // Seed missing classes
    for (const dc of defaultClasses) {
      const existing = await Class.findOne({
        $or: [{ class_code: dc.class_code }, { class_id: dc.class_id }],
      });
      if (!existing) {
        await Class.create(dc);
        console.log(`[ClassManagement] Seeded class ${dc.class_code} (${dc.name})`);
      } else if (!existing.class_code) {
        existing.class_code = dc.class_code;
        await existing.save();
      }
    }

    // Backfill any existing classes that lack class_code
    const unseeded = await Class.find({
      $or: [{ class_code: { $exists: false } }, { class_code: null }, { class_code: "" }],
    });
    for (const uc of unseeded) {
      if (uc.class_id === "CLASS-CS3A") uc.class_code = "3CSEA";
      else if (uc.class_id === "CLASS-CS3B") uc.class_code = "3CSEB";
      else if (uc.class_id === "CLASS-IT3A") uc.class_code = "3ITA";
      else uc.class_code = uc.class_id.replace(/^CLASS-/, "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
      await uc.save();
    }

    // Default subjects list
    const defaultSubjects = [
      // Subjects for CLASS-4CSEA (Year 4 Section A)
      {
        subject_id: "SUB-CS401-A",
        code: "CS401",
        name: "Machine Learning & Artificial Intelligence",
        class_id: "CLASS-4CSEA",
        teacher_email: "teacher@institution.edu",
        credits: 4,
        description: "Supervised and unsupervised learning, deep neural architectures, LLMs, and prompt engineering.",
        active: true,
      },
      {
        subject_id: "SUB-CS402-A",
        code: "CS402",
        name: "Cloud Computing & Distributed Systems",
        class_id: "CLASS-4CSEA",
        teacher_email: "teacher@institution.edu",
        credits: 4,
        description: "Microservices architectures, Kubernetes orchestration, serverless computing, and fault tolerance.",
        active: true,
      },
      {
        subject_id: "SUB-CS403-A",
        code: "CS403",
        name: "Information Security & Cryptography",
        class_id: "CLASS-4CSEA",
        teacher_email: "teacher@institution.edu",
        credits: 3,
        description: "Public key cryptography, TLS/SSL, authentication protocols, and zero-trust systems.",
        active: true,
      },
      {
        subject_id: "SUB-CS404-A",
        code: "CS404",
        name: "DevOps & Site Reliability Engineering",
        class_id: "CLASS-4CSEA",
        teacher_email: "teacher@institution.edu",
        credits: 3,
        description: "Continuous integration, deployment pipelines, infrastructure as code, and observability.",
        active: true,
      },

      // Subjects for CLASS-CS3A (Year 3 Section A)
      {
        subject_id: "SUB-CS301-A",
        code: "CS301",
        name: "Data Structures and Algorithms",
        class_id: "CLASS-CS3A",
        teacher_email: "teacher@institution.edu",
        credits: 4,
        description: "Advanced linear and non-linear data structures, trees, graphs, and algorithmic complexity.",
        active: true,
      },
      {
        subject_id: "SUB-CS302-A",
        code: "CS302",
        name: "Database Management Systems",
        class_id: "CLASS-CS3A",
        teacher_email: "teacher@institution.edu",
        credits: 4,
        description: "Relational database modeling, ER diagrams, normalization (1NF-BCNF), and SQL queries.",
        active: true,
      },
      {
        subject_id: "SUB-CS303-A",
        code: "CS303",
        name: "Operating Systems",
        class_id: "CLASS-CS3A",
        teacher_email: "teacher@institution.edu",
        credits: 3,
        description: "Process management, CPU scheduling, memory management, and file systems.",
        active: true,
      },
      {
        subject_id: "SUB-CS304-A",
        code: "CS304",
        name: "Computer Networks",
        class_id: "CLASS-CS3A",
        teacher_email: "teacher@institution.edu",
        credits: 3,
        description: "OSI and TCP/IP stack, routing protocols, flow control, and network security.",
        active: true,
      },

      // Subjects for CLASS-CS3B
      {
        subject_id: "SUB-CS301-B",
        code: "CS301",
        name: "Data Structures and Algorithms",
        class_id: "CLASS-CS3B",
        teacher_email: "teacher@institution.edu",
        credits: 4,
        description: "Data structures for Section B cohort.",
        active: true,
      },
      {
        subject_id: "SUB-CS302-B",
        code: "CS302",
        name: "Database Management Systems",
        class_id: "CLASS-CS3B",
        teacher_email: "teacher@institution.edu",
        credits: 4,
        description: "Database systems for Section B cohort.",
        active: true,
      },

      // Subjects for CLASS-IT3A
      {
        subject_id: "SUB-IT301-A",
        code: "IT301",
        name: "Web Technologies & Cloud Architectures",
        class_id: "CLASS-IT3A",
        teacher_email: "teacher@institution.edu",
        credits: 4,
        description: "Modern full-stack web applications, RESTful APIs, and cloud services.",
        active: true,
      },
    ];

    for (const sub of defaultSubjects) {
      const existingSub = await Subject.findOne({ class_id: sub.class_id, code: sub.code });
      if (!existingSub) {
        await Subject.create(sub);
      }
    }
  } catch (err) {
    console.error("[ClassManagement] Error seeding classes and subjects:", err.message);
  }
}

// 1. Get All Active Classes (Public / for Student Registration and Teacher Selection)
async function GetActiveClasses(req, res) {
  try {
    await seedDefaultClassesAndSubjectsIfEmpty();
    const classes = await Class.find({ active: true }).sort({ class_code: 1, name: 1 });
    res.status(200).json({ classes });
  } catch (err) {
    console.error("[ClassController] GetActiveClasses error:", err);
    res.status(500).json({ message: "Failed to fetch classes: " + err.message });
  }
}

// 1B. Lookup Class by Unique Class Code (Used for Real-time Student Signup Validation)
async function LookupClassByCode(req, res) {
  try {
    await seedDefaultClassesAndSubjectsIfEmpty();
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ valid: false, message: "Class code parameter is required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const classRecord = await Class.findOne({
      $or: [{ class_code: cleanCode }, { class_id: cleanCode }, { class_id: "CLASS-" + cleanCode }],
      active: true,
    });

    if (!classRecord) {
      return res.status(404).json({
        valid: false,
        message: `Class code "${cleanCode}" not found or inactive. Please verify with campus administration.`,
      });
    }

    const subjects = await Subject.find({ class_id: classRecord.class_id, active: true })
      .select("subject_id code name credits description")
      .sort({ code: 1 });

    res.status(200).json({
      valid: true,
      class: {
        class_id: classRecord.class_id,
        class_code: classRecord.class_code,
        name: classRecord.name,
        department: classRecord.department,
        academic_year: classRecord.academic_year,
        section: classRecord.section,
        semester: classRecord.semester,
      },
      subjects,
    });
  } catch (err) {
    console.error("[ClassController] LookupClassByCode error:", err);
    res.status(500).json({ valid: false, message: "Failed to verify class code: " + err.message });
  }
}

// 2. Get Subjects for a Specific Class
async function GetClassSubjects(req, res) {
  try {
    await seedDefaultClassesAndSubjectsIfEmpty();
    const { class_id } = req.params;

    if (!class_id) {
      return res.status(400).json({ message: "class_id is required" });
    }

    // Support either class_id or class_code in parameter
    let targetClassId = class_id;
    const directClass = await Class.findOne({
      $or: [{ class_id }, { class_code: class_id.toUpperCase() }],
    });
    if (directClass) {
      targetClassId = directClass.class_id;
    }

    const subjects = await Subject.find({ class_id: targetClassId, active: true }).sort({ code: 1 });
    res.status(200).json({ subjects });
  } catch (err) {
    console.error("[ClassController] GetClassSubjects error:", err);
    res.status(500).json({ message: "Failed to fetch subjects for class: " + err.message });
  }
}

// 3. Get Class Details with Enrolled Students Count and Subjects
async function GetClassDetails(req, res) {
  try {
    const { class_id } = req.params;
    const targetClass = await Class.findOne({
      $or: [{ class_id }, { class_code: class_id.toUpperCase() }],
    });

    if (!targetClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const [subjects, studentCount] = await Promise.all([
      Subject.find({ class_id: targetClass.class_id }),
      Student.countDocuments({
        $or: [{ class_id: targetClass.class_id }, { class_code: targetClass.class_code }],
      }),
    ]);

    res.status(200).json({
      class: targetClass,
      subjects,
      studentCount,
    });
  } catch (err) {
    console.error("[ClassController] GetClassDetails error:", err);
    res.status(500).json({ message: "Failed to fetch class details: " + err.message });
  }
}

// 4. Admin: Create Class
async function CreateClass(req, res) {
  try {
    const { class_code, class_id, name, department, academic_year, section, semester } = req.body;
    const tokenData = req.user;

    const providedCode = class_code || class_id;
    if (!providedCode || !name) {
      return res.status(400).json({ message: "class_code (e.g. 4CSEA) and name are required" });
    }

    const cleanClassCode = providedCode.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,16}$/.test(cleanClassCode)) {
      return res.status(400).json({
        message: "class_code must be 2 to 16 alphanumeric characters (e.g., 4CSEA, 3CSEB, 1CSEA)",
      });
    }

    const cleanClassId = (class_id || ("CLASS-" + cleanClassCode)).trim().toUpperCase();

    const existing = await Class.findOne({
      $or: [{ class_code: cleanClassCode }, { class_id: cleanClassId }],
    });
    if (existing) {
      return res.status(400).json({
        message: `A class with code "${cleanClassCode}" or ID "${cleanClassId}" already exists`,
      });
    }

    const newClass = new Class({
      class_id: cleanClassId,
      class_code: cleanClassCode,
      name: name.trim(),
      department: department || "Computer Science & Engineering",
      academic_year: academic_year || "4",
      section: section || "A",
      semester: semester || 7,
      active: true,
    });
    await newClass.save();

    await AuditLog.create({
      action: "CLASS_CREATED",
      performed_by: tokenData.email,
      role: tokenData.role || "admin",
      target_entity: cleanClassCode,
      details: { class_id: cleanClassId, class_code: cleanClassCode, name: name.trim(), department },
    });

    res.status(201).json({ message: "Class created successfully", class: newClass });
  } catch (err) {
    console.error("[ClassController] CreateClass error:", err);
    res.status(500).json({ message: "Failed to create class: " + err.message });
  }
}

// 5. Admin: Update Class
async function UpdateClass(req, res) {
  try {
    const { class_id, class_code, name, department, academic_year, section, semester, active } = req.body;
    const tokenData = req.user;

    if (!class_id && !class_code) {
      return res.status(400).json({ message: "class_id or class_code is required" });
    }

    const query = class_id ? { class_id } : { class_code: class_code.trim().toUpperCase() };
    const targetClass = await Class.findOne(query);

    if (!targetClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // If updating class_code, ensure uniqueness
    if (class_code) {
      const cleanCode = class_code.trim().toUpperCase();
      const duplicate = await Class.findOne({
        class_code: cleanCode,
        _id: { $ne: targetClass._id },
      });
      if (duplicate) {
        return res.status(400).json({ message: `Class code "${cleanCode}" is already in use by another class.` });
      }
      targetClass.class_code = cleanCode;
    }

    if (name) targetClass.name = name.trim();
    if (department) targetClass.department = department.trim();
    if (academic_year) targetClass.academic_year = academic_year.trim();
    if (section) targetClass.section = section.trim();
    if (semester !== undefined) targetClass.semester = Number(semester);
    if (active !== undefined) targetClass.active = Boolean(active);

    await targetClass.save();

    await AuditLog.create({
      action: "CLASS_UPDATED",
      performed_by: tokenData.email,
      role: tokenData.role || "admin",
      target_entity: targetClass.class_code,
      details: { targetClass },
    });

    res.status(200).json({ message: "Class updated successfully", class: targetClass });
  } catch (err) {
    console.error("[ClassController] UpdateClass error:", err);
    res.status(500).json({ message: "Failed to update class: " + err.message });
  }
}

// 6. Admin: Create Subject Mapped to a Class
async function CreateSubject(req, res) {
  try {
    const { subject_id, code, name, class_id, teacher_email, credits, description } = req.body;
    const tokenData = req.user;

    if (!code || !name || !class_id) {
      return res.status(400).json({ message: "code, name, and class_id are required" });
    }

    // Verify class exists
    const targetClass = await Class.findOne({ class_id });
    if (!targetClass) {
      return res.status(404).json({ message: `Target class ${class_id} does not exist` });
    }

    const cleanSubjectId = subject_id?.trim() || `SUB-${class_id}-${code.trim().toUpperCase()}`;
    const cleanCode = code.trim().toUpperCase();

    const existing = await Subject.findOne({ class_id, code: cleanCode });
    if (existing) {
      return res.status(400).json({ message: `Subject code ${cleanCode} is already mapped to class ${class_id}` });
    }

    const newSubject = new Subject({
      subject_id: cleanSubjectId,
      code: cleanCode,
      name: name.trim(),
      class_id,
      teacher_email: teacher_email || tokenData.email,
      credits: credits || 4,
      description: description || "",
      active: true,
    });
    await newSubject.save();

    await AuditLog.create({
      action: "SUBJECT_CREATED",
      performed_by: tokenData.email,
      role: tokenData.role || "admin",
      target_entity: cleanSubjectId,
      details: { code: cleanCode, name: name.trim(), class_id },
    });

    res.status(201).json({ message: "Subject created successfully and mapped to class", subject: newSubject });
  } catch (err) {
    console.error("[ClassController] CreateSubject error:", err);
    res.status(500).json({ message: "Failed to create subject: " + err.message });
  }
}

// 7. Admin: Update Subject
async function UpdateSubject(req, res) {
  try {
    const { subject_id, name, teacher_email, credits, description, active } = req.body;
    const tokenData = req.user;

    if (!subject_id) {
      return res.status(400).json({ message: "subject_id is required" });
    }

    const updated = await Subject.findOneAndUpdate(
      { subject_id },
      {
        ...(name && { name: name.trim() }),
        ...(teacher_email && { teacher_email: teacher_email.trim() }),
        ...(credits !== undefined && { credits: Number(credits) }),
        ...(description !== undefined && { description: description.trim() }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Subject not found" });
    }

    await AuditLog.create({
      action: "SUBJECT_UPDATED",
      performed_by: tokenData.email,
      role: tokenData.role || "admin",
      target_entity: subject_id,
      details: { updated },
    });

    res.status(200).json({ message: "Subject updated successfully", subject: updated });
  } catch (err) {
    console.error("[ClassController] UpdateSubject error:", err);
    res.status(500).json({ message: "Failed to update subject: " + err.message });
  }
}

// 8. Admin: Get All Classes & Subjects Directory
async function GetAllAdmin(req, res) {
  try {
    await seedDefaultClassesAndSubjectsIfEmpty();
    const [classes, subjects, studentCounts] = await Promise.all([
      Class.find({}).sort({ createdAt: -1 }),
      Subject.find({}).sort({ class_id: 1, code: 1 }),
      Student.aggregate([{ $group: { _id: "$class_id", count: { $sum: 1 } } }]),
    ]);

    const countMap = {};
    for (const sc of studentCounts) {
      if (sc._id) countMap[sc._id] = sc.count;
    }

    const enrichedClasses = classes.map((c) => ({
      ...c.toObject(),
      studentCount: countMap[c.class_id] || 0,
      subjects: subjects.filter((s) => s.class_id === c.class_id),
    }));

    res.status(200).json({ classes: enrichedClasses, totalSubjects: subjects.length });
  } catch (err) {
    console.error("[ClassController] GetAllAdmin error:", err);
    res.status(500).json({ message: "Failed to fetch administrative class directory: " + err.message });
  }
}

// 9. Admin: Get Students Enrolled in a Specific Class
async function GetClassStudents(req, res) {
  try {
    const { class_id } = req.params;
    const students = await Student.find({ class_id })
      .select("name email identityNumber pno dob class_id class_name createdAt")
      .sort({ identityNumber: 1 });

    res.status(200).json({ class_id, students });
  } catch (err) {
    console.error("[ClassController] GetClassStudents error:", err);
    res.status(500).json({ message: "Failed to fetch students: " + err.message });
  }
}

const ClassController = {
  seedDefaultClassesAndSubjectsIfEmpty,
  GetActiveClasses,
  LookupClassByCode,
  GetClassSubjects,
  GetClassDetails,
  CreateClass,
  UpdateClass,
  CreateSubject,
  UpdateSubject,
  GetAllAdmin,
  GetClassStudents,
};

export default ClassController;
