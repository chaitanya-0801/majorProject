import { Course } from "../model/Course.js";
import { Assessment } from "../model/Assessment.js";
import { AssessmentResult } from "../model/AssessmentResult.js";
import { StudentLearningProfile } from "../model/StudentLearningProfile.js";
import { Student } from "../model/Student.js";
import { ChatHistory } from "../model/ChatHistory.js";
import { AttendanceSession } from "../model/AttendanceSession.js";
import AcademicAnalyticsService from "../services/AcademicAnalyticsService.js";
import AiCurriculumService from "../services/AiCurriculumService.js";

// Helper: Seed Default Courses if database has none
async function seedDefaultCoursesIfEmpty(teacherEmail) {
  const count = await Course.countDocuments();
  if (count > 0) return;

  const sampleCourses = [
    {
      code: "CS301",
      name: "Data Structures and Algorithms",
      department: "Computer Science",
      semester: 4,
      teacher_email: teacherEmail || "teacher@jmit.ac.in",
      units: [
        {
          unit_number: 1,
          unit_title: "Linear Data Structures",
          topics: [
            {
              topic_id: "topic-arrays",
              title: "Arrays and Dynamic Sizing",
              learning_objectives: ["Understand memory contiguous allocation", "Analyze insertion/deletion amortized runtime"],
              prerequisites: ["Basic Programming in C/C++/Java"],
              estimated_hours: 3,
              difficulty: "beginner",
              recommended_resources: [
                { title: "Array Fundamentals & Complexity", type: "article", url: "https://en.wikipedia.org/wiki/Array_data_structure" },
              ],
            },
            {
              topic_id: "topic-linked-lists",
              title: "Singly and Doubly Linked Lists",
              learning_objectives: ["Pointer manipulation", "Traversing and node reversal", "Cycle detection"],
              prerequisites: ["Pointers and dynamic memory allocation"],
              estimated_hours: 5,
              difficulty: "intermediate",
              recommended_resources: [
                { title: "Linked List Visualizer & Operations", type: "documentation", url: "https://visualgo.net/en/list" },
              ],
            },
            {
              topic_id: "topic-stacks-queues",
              title: "Stacks, Queues, and Deques",
              learning_objectives: ["LIFO and FIFO data access", "Expression evaluation and parenthesis balancing"],
              prerequisites: ["Arrays", "Linked Lists"],
              estimated_hours: 4,
              difficulty: "intermediate",
              recommended_resources: [
                { title: "Stack and Queue Applications", type: "article", url: "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)" },
              ],
            },
          ],
        },
        {
          unit_number: 2,
          unit_title: "Non-Linear Structures & Recursion",
          topics: [
            {
              topic_id: "topic-recursion",
              title: "Recursion and Backtracking",
              learning_objectives: ["Base cases and recursive tree analysis", "Call stack mechanics"],
              prerequisites: ["Stacks", "Function Calls"],
              estimated_hours: 6,
              difficulty: "intermediate",
              recommended_resources: [
                { title: "Recursion Patterns", type: "article", url: "https://en.wikipedia.org/wiki/Recursion_(computer_science)" },
              ],
            },
            {
              topic_id: "topic-trees",
              title: "Binary Trees and BST Traversal",
              learning_objectives: ["Inorder, Preorder, Postorder traversal", "Binary Search Tree properties"],
              prerequisites: ["Recursion", "Pointers"],
              estimated_hours: 7,
              difficulty: "advanced",
              recommended_resources: [
                { title: "BST Interactive Visualizer", type: "documentation", url: "https://visualgo.net/en/bst" },
              ],
            },
          ],
        },
      ],
    },
    {
      code: "CS302",
      name: "Database Management Systems",
      department: "Computer Science",
      semester: 4,
      teacher_email: teacherEmail || "teacher@jmit.ac.in",
      units: [
        {
          unit_number: 1,
          unit_title: "Relational Data Modeling",
          topics: [
            {
              topic_id: "topic-er-model",
              title: "Entity-Relationship Diagrams",
              learning_objectives: ["Entity sets, relationships, cardinalities", "ER to Schema mapping"],
              prerequisites: ["Discrete Mathematics"],
              estimated_hours: 4,
              difficulty: "beginner",
              recommended_resources: [{ title: "ER Modeling Guide", type: "article", url: "https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model" }],
            },
            {
              topic_id: "topic-normalization",
              title: "Database Normalization (1NF to BCNF)",
              learning_objectives: ["Functional dependencies", "Decomposition without information loss"],
              prerequisites: ["Relational Algebra"],
              estimated_hours: 6,
              difficulty: "advanced",
              recommended_resources: [{ title: "Database Normalization", type: "article", url: "https://en.wikipedia.org/wiki/Database_normalization" }],
            },
          ],
        },
      ],
    },
  ];

  await Course.insertMany(sampleCourses);
  console.log("[Curriculum] Seeded initial institutional courses and syllabi");

  // Also seed a sample diagnostic assessment for CS301
  const existingAssessment = await Assessment.findOne({ assessment_id: "diag-cs301-1" });
  if (!existingAssessment) {
    await Assessment.create({
      assessment_id: "diag-cs301-1",
      course_code: "CS301",
      title: "Data Structures Mid-Term Diagnostic Assessment",
      type: "diagnostic",
      max_marks: 40,
      created_by: teacherEmail || "teacher@jmit.ac.in",
      topics_covered: ["topic-arrays", "topic-linked-lists", "topic-recursion"],
      questions: [
        {
          question_id: "q1",
          question_text: "What is the worst-case time complexity of inserting an element at the beginning of a singly linked list with a known head pointer?",
          options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"],
          correct_index: 0,
          explanation: "Inserting at the head requires creating a new node and updating the head pointer, taking constant O(1) time.",
          topic_id: "topic-linked-lists",
          topic_title: "Singly and Doubly Linked Lists",
        },
        {
          question_id: "q2",
          question_text: "In a doubly linked list, which pointers must be updated when deleting an internal node?",
          options: [
            "Both next pointer of previous node and prev pointer of next node",
            "Only next pointer of previous node",
            "Only prev pointer of next node",
            "No pointers need updating",
          ],
          correct_index: 0,
          explanation: "Both adjacent nodes must be re-linked: prevNode.next = nextNode and nextNode.prev = prevNode.",
          topic_id: "topic-linked-lists",
          topic_title: "Singly and Doubly Linked Lists",
        },
        {
          question_id: "q3",
          question_text: "What condition is required to prevent an infinite recursive loop causing stack overflow?",
          options: ["A base condition that terminates recursion", "Multiple recursive branches", "Dynamic array resizing", "Iterative while loop"],
          correct_index: 0,
          explanation: "Every recursive algorithm requires a valid base case to stop recursing and unwind the call stack.",
          topic_id: "topic-recursion",
          topic_title: "Recursion and Backtracking",
        },
        {
          question_id: "q4",
          question_text: "What is the memory access time complexity for retrieving an element by index in a contiguous array?",
          options: ["O(1)", "O(N)", "O(log N)", "O(N log N)"],
          correct_index: 0,
          explanation: "Arrays allow O(1) random access via arithmetic base address offset calculation.",
          topic_id: "topic-arrays",
          topic_title: "Arrays and Dynamic Sizing",
        },
      ],
    });
  }
}

// 1. Get Courses / Syllabi
async function GetCourses(req, res) {
  try {
    await seedDefaultCoursesIfEmpty(req.user?.email);
    const courses = await Course.find({}).sort({ code: 1 });
    res.status(200).json({ courses });
  } catch (err) {
    console.error("[Curriculum] GetCourses error:", err);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
}

// 2. Create Course (Teacher)
async function CreateCourse(req, res) {
  try {
    const { code, name, department, semester, units } = req.body;
    const tokenData = req.user;

    if (!code || !name) {
      return res.status(400).json({ message: "Course code and title are required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Course.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ message: "A course with this code already exists" });
    }

    const course = new Course({
      code: cleanCode,
      name: name.trim(),
      department: department || "Computer Science",
      semester: semester || 1,
      teacher_email: tokenData.email,
      units: units || [],
    });
    await course.save();

    res.status(201).json({ message: "Course created successfully", course });
  } catch (err) {
    console.error("[Curriculum] CreateCourse error:", err);
    res.status(500).json({ message: "Failed to create course" });
  }
}

// 3. Get Course Details by Code
async function GetCourseDetails(req, res) {
  try {
    const { code } = req.params;
    const course = await Course.findOne({ code: code.toUpperCase() });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ course });
  } catch (err) {
    console.error("[Curriculum] GetCourseDetails error:", err);
    res.status(500).json({ message: "Failed to fetch course details" });
  }
}

// 4. Get Assessments for a Course
async function GetAssessments(req, res) {
  try {
    const { course_code } = req.query;
    const filter = course_code ? { course_code: course_code.toUpperCase() } : {};
    const assessments = await Assessment.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ assessments });
  } catch (err) {
    console.error("[Curriculum] GetAssessments error:", err);
    res.status(500).json({ message: "Failed to fetch assessments" });
  }
}

// 5. Create Assessment (Teacher)
async function CreateAssessment(req, res) {
  try {
    const { course_code, title, type, questions, max_marks } = req.body;
    const tokenData = req.user;

    if (!course_code || !title || !questions || questions.length === 0) {
      return res.status(400).json({ message: "Course code, title, and at least one question are required" });
    }

    const assessment_id = `assess-${Date.now()}`;
    const topics_covered = [...new Set(questions.map((q) => q.topic_id).filter(Boolean))];

    const assessment = new Assessment({
      assessment_id,
      course_code: course_code.toUpperCase(),
      title: title.trim(),
      type: type || "quiz",
      max_marks: max_marks || questions.length * 10,
      questions,
      topics_covered,
      created_by: tokenData.email,
    });
    await assessment.save();

    res.status(201).json({ message: "Assessment created successfully", assessment });
  } catch (err) {
    console.error("[Curriculum] CreateAssessment error:", err);
    res.status(500).json({ message: "Failed to create assessment" });
  }
}

// 6. Submit Assessment (Student)
async function SubmitAssessment(req, res) {
  try {
    const { assessment_id, answers } = req.body;
    const tokenData = req.user;

    if (!assessment_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "assessment_id and answers array are required" });
    }

    const assessment = await Assessment.findOne({ assessment_id });
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    let earnedScore = 0;
    const pointsPerQuestion = assessment.max_marks / assessment.questions.length;
    const topicBreakdownMap = {};
    const processedAnswers = [];

    for (const q of assessment.questions) {
      const userSubmission = answers.find((a) => a.question_id === q.question_id);
      const selectedIndex = userSubmission ? userSubmission.selected_index : -1;
      const isCorrect = selectedIndex === q.correct_index;

      if (isCorrect) {
        earnedScore += pointsPerQuestion;
      }

      processedAnswers.push({
        question_id: q.question_id,
        selected_index: selectedIndex,
        is_correct: isCorrect,
      });

      if (!topicBreakdownMap[q.topic_id]) {
        topicBreakdownMap[q.topic_id] = {
          topic_id: q.topic_id,
          topic_title: q.topic_title,
          score: 0,
          max_score: 0,
        };
      }
      topicBreakdownMap[q.topic_id].max_score += pointsPerQuestion;
      if (isCorrect) {
        topicBreakdownMap[q.topic_id].score += pointsPerQuestion;
      }
    }

    const finalPercentage = Math.round((earnedScore / assessment.max_marks) * 100);

    const topicBreakdown = Object.values(topicBreakdownMap).map((tb) => {
      const pct = Math.round((tb.score / tb.max_score) * 100);
      let masteryLevel = "proficient";
      if (pct >= 80) masteryLevel = "mastered";
      else if (pct >= 65) masteryLevel = "proficient";
      else if (pct >= 50) masteryLevel = "needs_improvement";
      else masteryLevel = "critical_gap";

      return {
        topic_id: tb.topic_id,
        topic_title: tb.topic_title,
        score: Math.round(tb.score),
        max_score: Math.round(tb.max_score),
        percentage: pct,
        masteryLevel,
      };
    });

    const result = new AssessmentResult({
      result_id: `res-${Date.now()}`,
      assessment_id,
      course_code: assessment.course_code,
      student_email: tokenData.email,
      student_name: tokenData.name || "Student",
      total_score: Math.round(earnedScore),
      max_marks: assessment.max_marks,
      percentage: finalPercentage,
      topic_breakdown: topicBreakdown,
      answers: processedAnswers,
    });
    await result.save();

    res.status(200).json({
      message: "Assessment evaluated successfully",
      score: Math.round(earnedScore),
      maxMarks: assessment.max_marks,
      percentage: finalPercentage,
      topicBreakdown,
    });
  } catch (err) {
    console.error("[Curriculum] SubmitAssessment error:", err);
    res.status(500).json({ message: "Failed to evaluate assessment submission" });
  }
}

// 7. Get Comprehensive Student Analytics
async function GetStudentAnalytics(req, res) {
  try {
    const tokenData = req.user;
    const studentEmail = req.query.email || tokenData.email;

    // 1. Attendance Metrics
    const attendanceMetrics = await AcademicAnalyticsService.calculateStudentAttendance(studentEmail);

    // 2. Academic Performance & Topic Gaps
    const performanceMetrics = await AcademicAnalyticsService.calculateAcademicPerformance(studentEmail);

    // 3. Syllabus Progress (for CS301 default or primary course)
    const syllabusProgress = await AcademicAnalyticsService.calculateSyllabusProgress("CS301", performanceMetrics.strengths);

    // 4. Learning Profile & Active Plan
    const profile = await StudentLearningProfile.findOne({ student_email: studentEmail });

    res.status(200).json({
      attendance: attendanceMetrics,
      academic: performanceMetrics,
      syllabus: syllabusProgress,
      learningProfile: profile,
    });
  } catch (err) {
    console.error("[Curriculum] GetStudentAnalytics error:", err);
    res.status(500).json({ message: "Failed to calculate student analytics" });
  }
}

// 8. Generate Personalized AI Study Plan
async function GeneratePersonalizedPlan(req, res) {
  try {
    const tokenData = req.user;
    const studentEmail = tokenData.email;

    // Gather verified student academic data
    const performance = await AcademicAnalyticsService.calculateAcademicPerformance(studentEmail);
    const course = await Course.findOne({ code: "CS301" });
    const syllabusTopics = [];
    if (course) {
      for (const u of course.units) {
        for (const t of u.topics) {
          syllabusTopics.push(t);
        }
      }
    }

    const studentDoc = await Student.findOne({ email: studentEmail });
    const profileDoc = await StudentLearningProfile.findOne({ student_email: studentEmail });

    // Generate hybrid plan
    const generatedPlan = await AiCurriculumService.generatePersonalizedPlan({
      studentEmail,
      studentName: tokenData.name || studentDoc?.name || "Student",
      weakTopics: performance.weakTopics,
      strengths: performance.strengths,
      courseSyllabus: syllabusTopics,
      preferredPace: profileDoc?.preferred_pace || "standard",
    });

    // Update or create StudentLearningProfile
    let profile = await StudentLearningProfile.findOne({ student_email: studentEmail });
    if (!profile) {
      profile = new StudentLearningProfile({
        student_email: studentEmail,
        student_name: tokenData.name || studentDoc?.name || "Student",
        enrolled_courses: ["CS301", "CS302"],
        strengths: performance.strengths,
        learning_gaps: performance.weakTopics.map((wt) => ({
          topic_id: wt.topic_id,
          topic_title: wt.topic_title,
          course_code: wt.course_code,
          score_percentage: wt.percentage,
          severity: wt.severity,
        })),
        active_plan: generatedPlan,
        plan_history: [generatedPlan],
      });
    } else {
      profile.strengths = performance.strengths;
      profile.learning_gaps = performance.weakTopics.map((wt) => ({
        topic_id: wt.topic_id,
        topic_title: wt.topic_title,
        course_code: wt.course_code,
        score_percentage: wt.percentage,
        severity: wt.severity,
      }));
      if (profile.active_plan) {
        profile.plan_history.push(profile.active_plan);
      }
      profile.active_plan = generatedPlan;
    }
    await profile.save();

    res.status(200).json({
      message: "Personalized curriculum plan generated successfully",
      plan: generatedPlan,
    });
  } catch (err) {
    console.error("[Curriculum] GeneratePersonalizedPlan error:", err);
    res.status(500).json({ message: "Failed to generate personalized study plan" });
  }
}

// 9. Get Active Study Plan
async function GetActiveStudyPlan(req, res) {
  try {
    const tokenData = req.user;
    let profile = await StudentLearningProfile.findOne({ student_email: tokenData.email });

    if (!profile || !profile.active_plan || profile.active_plan.topics?.length === 0) {
      // Auto-generate initial plan if none exists
      return await GeneratePersonalizedPlan(req, res);
    }

    res.status(200).json({ plan: profile.active_plan });
  } catch (err) {
    console.error("[Curriculum] GetActiveStudyPlan error:", err);
    res.status(500).json({ message: "Failed to retrieve study plan" });
  }
}

// 10. Toggle Activity Completion Status
async function ToggleActivityCompletion(req, res) {
  try {
    const { activity_id } = req.body;
    const tokenData = req.user;

    if (!activity_id) {
      return res.status(400).json({ message: "activity_id is required" });
    }

    const profile = await StudentLearningProfile.findOne({ student_email: tokenData.email });
    if (!profile || !profile.active_plan) {
      return res.status(404).json({ message: "No active study plan found" });
    }

    let found = false;
    for (const topic of profile.active_plan.topics) {
      for (const act of topic.activities) {
        if (act.activity_id === activity_id) {
          act.completed = !act.completed;
          act.completed_at = act.completed ? new Date() : null;
          found = true;
          break;
        }
      }
      // Check if all activities for topic are completed
      const allCompleted = topic.activities.every((a) => a.completed);
      const someCompleted = topic.activities.some((a) => a.completed);
      topic.progress_status = allCompleted ? "completed" : someCompleted ? "in_progress" : "not_started";
    }

    if (!found) {
      return res.status(404).json({ message: "Activity not found in current plan" });
    }

    await profile.save();
    res.status(200).json({ message: "Activity status updated", plan: profile.active_plan });
  } catch (err) {
    console.error("[Curriculum] ToggleActivityCompletion error:", err);
    res.status(500).json({ message: "Failed to toggle activity status" });
  }
}

// 11. Teacher Analytics: Class-wide Gaps and AI Recommendations
async function GetTeacherClassAnalytics(req, res) {
  try {
    const courseCode = req.query.course_code || "CS301";
    const classGaps = await AcademicAnalyticsService.calculateClassGaps(courseCode);
    const recommendations = await AiCurriculumService.generateTeacherRecommendations({
      courseName: courseCode,
      classGaps,
    });

    res.status(200).json({
      courseCode,
      classGaps,
      aiRecommendations: recommendations,
    });
  } catch (err) {
    console.error("[Curriculum] GetTeacherClassAnalytics error:", err);
    res.status(500).json({ message: "Failed to compute teacher analytics" });
  }
}

// 12. Conversational AI Curriculum Assistant: Chat Message Handler
async function HandleChat(req, res) {
  try {
    const { message } = req.body;
    const tokenData = req.user;

    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Authentication required to converse with AI Curriculum Assistant" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const cleanEmail = tokenData.email.trim().toLowerCase();

    // 1. Gather comprehensive real-time verified academic context
    const studentUser = await Student.findOne({ email: cleanEmail });
    const classFilter = [];
    if (studentUser?.class_id) classFilter.push({ class_id: studentUser.class_id });
    if (studentUser?.class_code) classFilter.push({ class_code: studentUser.class_code });

    const [attendanceMetrics, academicMetrics, profileDoc, liveSessions] = await Promise.all([
      AcademicAnalyticsService.calculateStudentAttendance(cleanEmail),
      AcademicAnalyticsService.calculateAcademicPerformance(cleanEmail),
      StudentLearningProfile.findOne({ student_email: cleanEmail }),
      classFilter.length > 0
        ? AttendanceSession.find({ status: "active", $or: classFilter })
            .select("session_id name subject_name course_code teacher_name date time duration")
        : [],
    ]);

    const studentName = studentUser?.name || tokenData.name || "Student";
    const studentClass = studentUser?.class_name || "B.Tech Computer Science - 4th Year Section A";
    const studentClassCode = studentUser?.class_code || "4CSEA";

    // 2. Load or initialize chat thread
    let chatDoc = await ChatHistory.findOne({ student_email: cleanEmail });
    if (!chatDoc) {
      chatDoc = new ChatHistory({
        student_email: cleanEmail,
        messages: [],
        saved_plans: [],
      });
    }

    // 3. Process conversational turn
    const reply = await AiCurriculumService.handleCurriculumChat({
      studentName,
      message: message.trim(),
      history: chatDoc.messages,
      academicContext: {
        attendance: attendanceMetrics,
        academic: academicMetrics,
        studentClass,
        studentClassCode,
        enrolledSubjects: studentUser?.enrolled_courses || [],
        upcomingSessions: liveSessions || [],
        learningProfile: profileDoc,
      },
    });

    // 4. Persist messages in database
    chatDoc.messages.push({
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    });

    chatDoc.messages.push({
      role: "assistant",
      content: reply,
      timestamp: new Date(),
    });

    await chatDoc.save();

    res.status(200).json({
      reply,
      history: chatDoc.messages,
      academicContext: {
        attendance: attendanceMetrics,
        academic: academicMetrics,
        studentClass,
        studentClassCode,
        upcomingSessions: liveSessions || [],
      },
    });
  } catch (err) {
    console.error("[Curriculum] HandleChat error:", err);
    res.status(500).json({ message: "Failed to generate AI response: " + err.message });
  }
}

// 13. Get Chat History
async function GetChatHistory(req, res) {
  try {
    const tokenData = req.user;
    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const cleanEmail = tokenData.email.trim().toLowerCase();
    const chatDoc = await ChatHistory.findOne({ student_email: cleanEmail });

    res.status(200).json({
      messages: chatDoc?.messages || [],
      saved_plans: chatDoc?.saved_plans || [],
    });
  } catch (err) {
    console.error("[Curriculum] GetChatHistory error:", err);
    res.status(500).json({ message: "Failed to load chat history" });
  }
}

// 14. Clear Chat History
async function ClearChatHistory(req, res) {
  try {
    const tokenData = req.user;
    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const cleanEmail = tokenData.email.trim().toLowerCase();
    await ChatHistory.findOneAndUpdate(
      { student_email: cleanEmail },
      { $set: { messages: [] } },
      { upsert: true }
    );

    res.status(200).json({ message: "Conversation history cleared successfully" });
  } catch (err) {
    console.error("[Curriculum] ClearChatHistory error:", err);
    res.status(500).json({ message: "Failed to clear chat history" });
  }
}

// 15. Save Study Plan from Conversation
async function SaveStudyPlanFromChat(req, res) {
  try {
    const { title, weekly_schedule, focus_topics, notes, summary } = req.body;
    const tokenData = req.user;

    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const cleanEmail = tokenData.email.trim().toLowerCase();
    const plan_id = `plan-${Date.now()}`;

    const newPlan = {
      plan_id,
      title: title || `Study Plan - ${new Date().toLocaleDateString()}`,
      created_at: new Date(),
      summary: summary || "Personalized schedule generated through AI Curriculum Consultation.",
      weekly_schedule: weekly_schedule || [],
      focus_topics: focus_topics || [],
      notes: notes || "",
    };

    let chatDoc = await ChatHistory.findOne({ student_email: cleanEmail });
    if (!chatDoc) {
      chatDoc = new ChatHistory({
        student_email: cleanEmail,
        messages: [],
        saved_plans: [newPlan],
      });
    } else {
      chatDoc.saved_plans.unshift(newPlan);
    }
    await chatDoc.save();

    res.status(200).json({ message: "Study plan saved successfully", plan: newPlan });
  } catch (err) {
    console.error("[Curriculum] SaveStudyPlanFromChat error:", err);
    res.status(500).json({ message: "Failed to save study plan" });
  }
}

// 16. Get Saved Study Plans
async function GetSavedPlans(req, res) {
  try {
    const tokenData = req.user;
    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const cleanEmail = tokenData.email.trim().toLowerCase();
    const chatDoc = await ChatHistory.findOne({ student_email: cleanEmail });

    res.status(200).json({ saved_plans: chatDoc?.saved_plans || [] });
  } catch (err) {
    console.error("[Curriculum] GetSavedPlans error:", err);
    res.status(500).json({ message: "Failed to fetch saved study plans" });
  }
}

const CurriculumController = {
  GetCourses,
  CreateCourse,
  GetCourseDetails,
  GetAssessments,
  CreateAssessment,
  SubmitAssessment,
  GetStudentAnalytics,
  GeneratePersonalizedPlan,
  GetActiveStudyPlan,
  ToggleActivityCompletion,
  GetTeacherClassAnalytics,
  HandleChat,
  GetChatHistory,
  ClearChatHistory,
  SaveStudyPlanFromChat,
  GetSavedPlans,
};

export default CurriculumController;
