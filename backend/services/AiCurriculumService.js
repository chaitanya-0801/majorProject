import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

export class AiCurriculumService {
  /**
   * Initialize Gemini client if API key is present
   */
  static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
      return new GoogleGenAI({ apiKey });
    } catch (err) {
      console.warn("[AiCurriculum] Could not initialize GoogleGenAI client:", err.message);
      return null;
    }
  }

  /**
   * Deterministic Fallback Generator
   * Generates structured, explainable, syllabus-grounded curriculum plans when AI API is unavailable.
   */
  static generateDeterministicStudyPlan({ studentName, weakTopics, courseSyllabus, preferredPace }) {
    const paceMultiplier = preferredPace === "accelerated" ? 0.8 : preferredPace === "remedial" ? 1.3 : 1.0;

    const topicsToStudy = [];

    // Prioritize identified weak topics first
    if (weakTopics && weakTopics.length > 0) {
      for (let i = 0; i < Math.min(weakTopics.length, 3); i++) {
        const wt = weakTopics[i];
        const estHours = Math.round(4 * paceMultiplier);
        topicsToStudy.push({
          topic_id: wt.topic_id,
          topic_title: wt.topic_title,
          course_code: wt.course_code || "Core Subject",
          priority: wt.severity === "critical" ? "high" : "medium",
          estimated_hours: estHours,
          reason: `Recommended because recent assessment demonstrated a score of ${wt.percentage}%, indicating a ${wt.severity} learning gap that requires conceptual reinforcement.`,
          learning_objectives: [
            `Understand fundamental principles and definitions of ${wt.topic_title}`,
            `Analyze standard use cases, algorithmic complexity, and edge conditions`,
            `Solve representative practice problems and verify solution correctness`,
          ],
          prerequisites: ["Core introductory lectures and lecture notes"],
          activities: [
            {
              activity_id: `act-${wt.topic_id}-1`,
              title: `Review Lecture Notes & Textbook Chapter on ${wt.topic_title}`,
              type: "reading",
              duration_minutes: 45,
              resource_url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(wt.topic_title),
              completed: false,
            },
            {
              activity_id: `act-${wt.topic_id}-2`,
              title: `Walkthrough & Diagnostic Practice on ${wt.topic_title}`,
              type: "coding_exercise",
              duration_minutes: 60,
              resource_url: "https://leetcode.com/problemset/all/?search=" + encodeURIComponent(wt.topic_title),
              completed: false,
            },
            {
              activity_id: `act-${wt.topic_id}-3`,
              title: `Self-Assessment Revision Quiz for ${wt.topic_title}`,
              type: "practice_quiz",
              duration_minutes: 30,
              resource_url: "",
              completed: false,
            },
          ],
          practice_questions: [
            {
              question: `Which of the following is a primary consideration when implementing ${wt.topic_title}?`,
              options: [
                "Time and space complexity trade-offs under edge conditions",
                "Arbitrary memory allocation without boundary checks",
                "Omitting termination conditions in iterative structures",
                "Ignoring underlying data structures and references",
              ],
              correct_index: 0,
              explanation: `Efficient implementation of ${wt.topic_title} requires deliberate analysis of asymptotic time and memory complexity.`,
            },
            {
              question: `What is the expected asymptotic time complexity for typical operations in ${wt.topic_title}?`,
              options: ["O(1) or O(log N) on average", "Always O(N!)", "Unbounded time complexity", "O(2^N) unconditionally"],
              correct_index: 0,
              explanation: "Well-structured operations in this topic maintain polynomial or logarithmic average bounds.",
            },
          ],
          progress_status: "not_started",
        });
      }
    }

    // If no weak topics, recommend next progressive topics from syllabus
    if (topicsToStudy.length === 0 && courseSyllabus && courseSyllabus.length > 0) {
      for (let i = 0; i < Math.min(courseSyllabus.length, 2); i++) {
        const st = courseSyllabus[i];
        topicsToStudy.push({
          topic_id: st.topic_id,
          topic_title: st.title,
          course_code: "Course Core",
          priority: "medium",
          estimated_hours: 3,
          reason: `Upcoming module in the institutional curriculum syllabus. Advance preparation ensures mastery of upcoming coursework.`,
          learning_objectives: st.learning_objectives || [
            `Master key concepts and terminology of ${st.title}`,
            `Prepare for upcoming practical assignments and class discussions`,
          ],
          prerequisites: st.prerequisites || ["Previous unit topics"],
          activities: [
            {
              activity_id: `act-${st.topic_id}-1`,
              title: `Pre-lecture Reading on ${st.title}`,
              type: "reading",
              duration_minutes: 45,
              resource_url: "",
              completed: false,
            },
            {
              activity_id: `act-${st.topic_id}-2`,
              title: `Conceptual Check & Practice Problems`,
              type: "practice_quiz",
              duration_minutes: 30,
              resource_url: "",
              completed: false,
            },
          ],
          practice_questions: [
            {
              question: `What is the fundamental objective of studying ${st.title}?`,
              options: [
                "Developing problem-solving frameworks and foundational mastery",
                "Memorizing syntax without conceptual comprehension",
                "Bypassing prerequisite foundational units",
                "None of the above",
              ],
              correct_index: 0,
              explanation: "Foundational mastery provides the base required for subsequent advanced topics.",
            },
          ],
          progress_status: "not_started",
        });
      }
    }

    return {
      plan_id: `plan-${Date.now()}`,
      generated_at: new Date(),
      week_label: "Current Weekly Roadmap",
      summary: topicsToStudy.length > 0
        ? `Personalized study plan created for ${studentName}. Focuses on addressing ${topicsToStudy.length} prioritized topics based on assessment outcomes and institutional syllabus progression.`
        : `All evaluated topics are currently mastered. Keep reviewing advanced materials to maintain academic excellence!`,
      ai_provider: "AttendEase Deterministic Pedagogical Engine (Verified Syllabus Alignment)",
      topics: topicsToStudy,
    };
  }

  /**
   * Generate Personalized Study Plan (Hybrid Gemini AI + Deterministic Fallback)
   */
  static async generatePersonalizedPlan({
    studentEmail,
    studentName,
    weakTopics = [],
    strengths = [],
    courseSyllabus = [],
    preferredPace = "standard",
  }) {
    const aiClient = this.getClient();

    if (!aiClient) {
      console.log("[AiCurriculum] No GEMINI_API_KEY detected. Using deterministic pedagogical engine.");
      return this.generateDeterministicStudyPlan({ studentName, weakTopics, courseSyllabus, preferredPace });
    }

    try {
      const prompt = `
You are an expert academic curriculum advisor. Generate a personalized weekly study plan for student ${studentName}.
Verified Academic Data:
- Strengths: ${JSON.stringify(strengths)}
- Identified Learning Gaps / Weak Topics: ${JSON.stringify(weakTopics)}
- Preferred Pace: ${preferredPace}
- Institutional Syllabus Topics: ${JSON.stringify(courseSyllabus.slice(0, 5))}

Instructions:
1. Address the weak topics first, explaining clearly WHY each topic was chosen based on the assessment score.
2. Outline specific learning objectives, estimated hours, and concrete learning activities.
3. Include 2 multiple choice practice questions for each topic with options, correct answer index, and explanations.
4. Output strictly valid JSON matching this schema:
{
  "summary": "Short 2-3 sentence overview for the student",
  "topics": [
    {
      "topic_id": "string",
      "topic_title": "string",
      "course_code": "string",
      "priority": "high" | "medium" | "low",
      "estimated_hours": number,
      "reason": "Detailed explanation grounded in the student's actual performance",
      "learning_objectives": ["string"],
      "prerequisites": ["string"],
      "activities": [
        {
          "activity_id": "string",
          "title": "string",
          "type": "reading" | "video" | "practice_quiz" | "coding_exercise" | "revision",
          "duration_minutes": number,
          "resource_url": "string"
        }
      ],
      "practice_questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correct_index": 0,
          "explanation": "string"
        }
      ]
    }
  ]
}
`;

      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = response.text;
      const parsed = JSON.parse(responseText);

      return {
        plan_id: `plan-${Date.now()}`,
        generated_at: new Date(),
        week_label: "AI-Powered Weekly Roadmap",
        summary: parsed.summary,
        ai_provider: "Google Gemini 2.5 Flash",
        topics: parsed.topics.map((t) => ({
          ...t,
          progress_status: "not_started",
          activities: (t.activities || []).map((a) => ({
            ...a,
            completed: false,
          })),
        })),
      };
    } catch (err) {
      console.warn("[AiCurriculum] Gemini API invocation failed, falling back to deterministic plan:", err.message);
      return this.generateDeterministicStudyPlan({ studentName, weakTopics, courseSyllabus, preferredPace });
    }
  }

  /**
   * Generate Teacher Class Improvement Recommendations
   */
  static async generateTeacherRecommendations({ courseName, classGaps = [] }) {
    const aiClient = this.getClient();

    if (!aiClient || classGaps.length === 0) {
      return {
        courseName,
        summary: `Class-wide performance analysis for ${courseName}.`,
        recommendations: classGaps.map((g) => ({
          topic: g.topic_title,
          averageScore: g.averageScore,
          strugglingCount: g.strugglingCount,
          action: g.averageScore < 50
            ? `Schedule a dedicated review session and practical lab. ${g.strugglingCount} students scored under 60%.`
            : `Provide supplemental reading materials and targeted review quizzes.`,
        })),
      };
    }

    try {
      const prompt = `
Analyze class-wide learning gaps for course ${courseName}:
Gaps: ${JSON.stringify(classGaps)}

Provide specific, actionable instructional recommendations for the teacher. Output strictly JSON:
{
  "summary": "Overview of class cohort performance",
  "recommendations": [
    {
      "topic": "string",
      "averageScore": number,
      "strugglingCount": number,
      "action": "Specific pedagogical intervention for the instructor"
    }
  ]
}
`;

      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      return JSON.parse(response.text);
    } catch (err) {
      console.warn("[AiCurriculum] Teacher AI recommendation failed, using rule-based summary:", err.message);
      return {
        courseName,
        summary: `Performance overview for ${courseName}.`,
        recommendations: classGaps.map((g) => ({
          topic: g.topic_title,
          averageScore: g.averageScore,
          strugglingCount: g.strugglingCount,
          action: `Targeted review recommended for ${g.topic_title} to reinforce concepts with ${g.strugglingCount} struggling students.`,
        })),
      };
    }
  }

  /**
   * Deterministic Conversational AI Fallback Reply
   */
  static generateDeterministicChatReply({ studentName, message, academicContext }) {
    const lower = (message || "").toLowerCase();
    const attendance = academicContext?.attendance;
    const academic = academicContext?.academic;
    const studentClass = academicContext?.studentClass || "B.Tech Computer Science - 4th Year";
    const studentClassCode = academicContext?.studentClassCode || "4CSEA";
    const upcomingSessions = academicContext?.upcomingSessions || [];

    // 0. Prioritizing Upcoming Sessions & Daily Schedule
    if (
      lower.includes("prioritize") ||
      lower.includes("upcoming") ||
      lower.includes("today") ||
      lower.includes("next class") ||
      lower.includes("which class")
    ) {
      if (!upcomingSessions || upcomingSessions.length === 0) {
        return `Hello ${studentName}! There are currently no active live attendance sessions scheduled right now for your class **${studentClass}** (${studentClassCode}). However, looking at your verified subject attendance, your highest priority course to attend when scheduled is **${attendance?.subjectWise?.find((s) => s.isShortage)?.subject || "your enrolled core course"}** where maintaining attendance above 75% is critical.`;
      }

      let reply = `### 🎯 Prioritized Upcoming Class Recommendations for ${studentName}\n\n`;
      reply += `Here are the active live sessions currently open for your class **${studentClassCode}** (${studentClass}):\n\n`;

      for (const s of upcomingSessions) {
        const match = attendance?.subjectWise?.find((sw) => sw.subject === s.subject_name || sw.subject === s.name);
        const isShortage = match?.isShortage;
        const pct = match ? `${match.percentage}%` : "No prior records";
        const priorityBadge = isShortage ? "🚨 **HIGH PRIORITY - SHORTAGE**" : "✅ Normal - On Track";

        reply += `1. **${s.subject_name || s.name}** (${s.course_code || "Core"})\n`;
        reply += `   - Instructor: ${s.teacher_name || "Faculty"}\n`;
        reply += `   - Time / Duration: ${s.time} (${s.duration || "60 mins"})\n`;
        reply += `   - Your Current Attendance: **${pct}**\n`;
        reply += `   - Action Priority: ${priorityBadge}\n`;
        if (isShortage && match) {
          reply += `   - *Critical Notice*: You need ${match.consecutiveNeededToReach75} consecutive classes to reach 75%. Marking attendance for this session is urgent!\n`;
        } else if (match) {
          reply += `   - *Notice*: You have a safe buffer of ${match.safeClassesCanMiss} class(es), but attending is recommended to stay ahead.\n`;
        }
        reply += `\n`;
      }

      reply += `👉 You can mark attendance directly from your **Student Dashboard** under the **Live Classes** section or by scanning the classroom QR code!`;
      return reply;
    }

    // 1. Attendance & 75% Rule Questions
    if (
      lower.includes("attendance") ||
      lower.includes("75") ||
      lower.includes("miss") ||
      lower.includes("skip") ||
      lower.includes("absent") ||
      lower.includes("consecutive") ||
      lower.includes("shortage") ||
      lower.includes("standing")
    ) {
      if (!attendance || !attendance.subjectWise || attendance.subjectWise.length === 0) {
        return `Hello ${studentName}! I checked your attendance database records for ${studentClass} (${studentClassCode}). Currently, no attendance sessions have been logged for your enrolled courses yet. Remember that the university requires a minimum of **75% attendance** in each course to be eligible for end-term examinations. Whenever you attend a lecture, be sure to mark attendance from your dashboard or scan the QR code!`;
      }

      let reply = `### 📊 Verified Attendance Standing & 75% Rule Analysis\n\n`;
      reply += `Hello ${studentName}! Here is your verified course-by-course attendance status for **${studentClassCode}**:\n\n`;

      const shortageSubjects = attendance.subjectWise.filter((s) => s.isShortage);
      const onTrackSubjects = attendance.subjectWise.filter((s) => !s.isShortage);

      if (shortageSubjects.length > 0) {
        reply += `⚠️ **Attention Required (${shortageSubjects.length} course(s) below the 75% institutional requirement):**\n\n`;
        for (const s of shortageSubjects) {
          reply += `- **${s.subject}**: **${s.percentage}%** (${s.attended}/${s.total} attended) — *Status: ${s.status}*\n`;
          reply += `  - 🎯 **Target Action**: You must attend the next **${s.consecutiveNeededToReach75} consecutive classes** without any absence to bring your attendance up to 75%.\n`;
          reply += `  - ⚠️ **Miss Impact**: If you miss the upcoming lecture, your attendance will drop to **${s.projectedIfMissNext}%**, requiring **${s.consecutiveNeededIfMissNext} consecutive sessions** to recover.\n\n`;
        }
      }

      if (onTrackSubjects.length > 0) {
        reply += `✅ **Courses in Good Standing (≥ 75%):**\n\n`;
        for (const s of onTrackSubjects) {
          reply += `- **${s.subject}**: **${s.percentage}%** (${s.attended}/${s.total} attended) — *Status: On Track*\n`;
          reply += `  - 🛡️ **Safe Buffer**: You can safely miss up to **${s.safeClassesCanMiss} lecture(s)** while maintaining at least 75% attendance.\n`;
          reply += `  - ⚠️ **If you miss the next lecture**: Your attendance will be **${s.projectedIfMissNext}%**.\n\n`;
        }
      }

      reply += `\n**Overall Attendance**: **${attendance.overallPercentage}%** across all courses (${attendance.overallStatus}).\n\n`;
      if (lower.includes("miss") || lower.includes("skip")) {
        if (shortageSubjects.length > 0) {
          reply += `💡 **Recommendation**: Missing lectures in courses marked with a shortage is strongly discouraged, as every absence significantly increases the number of consecutive makeup lectures required.`;
        } else {
          reply += `💡 **Recommendation**: While you have a safety margin in your on-track courses, regular attendance keeps you ahead of syllabus progression and ensures maximum internal assessment scores!`;
        }
      }
      return reply;
    }

    // 2. Study Plan / Schedule / Routine
    if (
      lower.includes("plan") ||
      lower.includes("schedule") ||
      lower.includes("routine") ||
      lower.includes("timetable") ||
      lower.includes("study") ||
      lower.includes("week")
    ) {
      const weakTopics = academic?.weakTopics || [];
      const topWeak = weakTopics.slice(0, 3);

      let reply = `### 📅 Personalized Weekly Study Roadmap for ${studentName}\n\n`;
      reply += `Based on your recent assessment diagnostics and enrolled syllabus in **${studentClass}** (${studentClassCode}), I have constructed a balanced weekly study schedule designed to eliminate conceptual bottlenecks while fitting a realistic daily schedule:\n\n`;

      const days = [
        { day: "Monday", focus: topWeak[0]?.topic_title || "Core Syllabus Review & Notes Analysis", type: "Concept Review & Trace", time: "1.5 hours" },
        { day: "Tuesday", focus: "Applied Problem Solving & Algorithmic Design", type: "Problem Solving", time: "1 hour" },
        { day: "Wednesday", focus: topWeak[1]?.topic_title || "Deep Dive Revision & Implementation", type: "Code Implementation", time: "1.5 hours" },
        { day: "Thursday", focus: "Architecture & Systems Principles", type: "Theory & Diagrams", time: "1 hour" },
        { day: "Friday", focus: topWeak[2]?.topic_title || "Self-Assessment Diagnostic Review", type: "Practice Quiz & Self-Check", time: "1 hour" },
        { day: "Saturday", focus: "Integration Exercises & Weak Topic Re-test", type: "Diagnostic Review", time: "2 hours" },
        { day: "Sunday", focus: "Rest, Revision Notes Consolidation & Upcoming Lecture Prep", type: "Light Reading", time: "45 minutes" },
      ];

      for (const d of days) {
        reply += `- **${d.day}** (${d.time}): **${d.focus}**\n  - *Activity*: ${d.type}\n`;
      }

      reply += `\n**Key Milestones this Week**:\n`;
      reply += `1. Review foundational definitions and time complexity trade-offs.\n`;
      reply += `2. Complete at least 5 representative coding/theory problems.\n`;
      reply += `3. Retake diagnostic quiz at the end of the week to verify mastery.\n\n`;
      reply += `💬 *Want to customize this plan? Tell me how many hours you prefer per day or which specific subject you want to prioritize!*`;

      return reply;
    }

    // 3. Weak Topics & Diagnostic Gaps
    if (
      lower.includes("weak") ||
      lower.includes("gap") ||
      lower.includes("score") ||
      lower.includes("grade") ||
      lower.includes("marks") ||
      lower.includes("struggling") ||
      lower.includes("topics")
    ) {
      const weakTopics = academic?.weakTopics || [];
      const strengths = academic?.strengths || [];

      let reply = `### 🎯 Diagnostic Performance & Learning Gap Breakdown\n\n`;
      reply += `Hello ${studentName}! Here is the detailed breakdown from your recent academic assessments in **${studentClassCode}**:\n\n`;

      if (weakTopics.length > 0) {
        reply += `🚨 **Priority Focus Areas (Identified Learning Gaps):**\n\n`;
        for (const wt of weakTopics) {
          reply += `- **${wt.topic_title}** (${wt.course_code}): Evaluated at **${wt.percentage}%** (*Severity: ${wt.severity}*)\n`;
          reply += `  - *Recommended Remediation*: Dedicated review of core unit lecture slides followed by targeted practice questions.\n`;
        }
        reply += `\n`;
      } else {
        reply += `🎉 **No critical learning gaps detected!** You have demonstrated solid foundational comprehension across your completed assessments.\n\n`;
      }

      if (strengths.length > 0) {
        reply += `⭐ **Current Strengths (Mastered Topics):**\n`;
        for (const str of strengths) {
          reply += `- **${str}** (Score ≥ 75%)\n`;
        }
        reply += `\n`;
      }

      reply += `Would you like me to generate a step-by-step revision plan or practice questions for any of these topics?`;
      return reply;
    }

    // 4. Default Greeting & Guided Assistant Menu
    return `Hello ${studentName}! 👋 I am your **AttendEase AI Curriculum Assistant** for class **${studentClassCode}** (${studentClass}).\n\n` +
      `I have real-time access to your verified academic records, syllabus progress, and attendance metrics. Here is how I can assist you today:\n\n` +
      `1. **Attendance Planning (75% Rule)**: Ask *"How many classes do I need to attend to reach 75%?"* or *"Can I miss tomorrow's lecture?"*\n` +
      `2. **Upcoming Class Priority**: Ask *"Which upcoming classes should I prioritize today?"*\n` +
      `3. **Personalized Study Schedule**: Ask *"Create a weekly study plan for my weak topics"* or *"I only have 1 hour a day to study"*\n` +
      `4. **Learning Gap Diagnostics**: Ask *"Which topics do I need to focus on before exams?"*\n` +
      `5. **Practice Questions**: Ask *"Give me practice questions for Machine Learning"* or *"Explain normalization in DBMS"*\n\n` +
      `How can I support your academic progress right now?`;
  }

  /**
   * Conversational Chat Handler with Context Awareness and 75% Attendance Math
   */
  static async handleCurriculumChat({ studentName, message, history = [], academicContext }) {
    const aiClient = this.getClient();

    if (!aiClient) {
      console.log("[AiCurriculum] No GEMINI_API_KEY detected. Using deterministic conversational pedagogical assistant.");
      return this.generateDeterministicChatReply({ studentName, message, academicContext });
    }

    try {
      const studentClass = academicContext?.studentClass || "B.Tech Computer Science - 4th Year Section A";
      const studentClassCode = academicContext?.studentClassCode || "4CSEA";
      const attendance = academicContext?.attendance;
      const academic = academicContext?.academic;
      const upcomingSessions = academicContext?.upcomingSessions || [];
      const enrolledSubjects = academicContext?.enrolledSubjects || [];

      const systemPrompt = `
You are the AttendEase Conversational AI Curriculum Advisor for student "${studentName}" in class "${studentClass}" (Code: ${studentClassCode}).
All user-facing responses must be strictly in professional English.
You must be warm, encouraging, intellectually rigorous, and helpful.
Use markdown formatting with bolding, lists, and headers where helpful.

Verified Real Database Academic Context for this Student:
- Class: ${studentClass}
- Class Code: ${studentClassCode}
- Enrolled Subjects: ${JSON.stringify(enrolledSubjects)}
- Attendance Overall: ${attendance?.overallPercentage || 0}% (${attendance?.overallStatus || "Unknown"})
- Attendance Projections & 75% Rule Math:
${JSON.stringify(attendance?.subjectWise || [], null, 2)}
- Live Upcoming Attendance Sessions in Class:
${JSON.stringify(upcomingSessions, null, 2)}
- Academic Assessment Scores & Average: ${academic?.overallAverage || 0}%
- Identified Weak Topics / Learning Gaps: ${JSON.stringify(academic?.weakTopics || [], null, 2)}
- Mastered Strengths: ${JSON.stringify(academic?.strengths || [], null, 2)}

Key Rules:
1. When asked which upcoming classes to prioritize, evaluate the student's real upcoming sessions listed above. If any session's subject has attendance below 75% or near 75%, prioritize it urgently!
2. When asked about attendance or missing a class, use the EXACT consecutive classes needed and safe buffer calculations from the context above.
3. If the student has attendance below 75%, explain clearly how many upcoming consecutive sessions they must attend to reach 75%.
4. If the student asks if they can skip or miss a lecture, tell them what their attendance will drop to if they miss, and whether they have any safe buffer.
5. When asked for study schedules, produce actionable day-by-day study plans addressing their weak areas from their actual enrolled syllabus.
6. Support iterative refinement: adjust time, days, or topics if requested.
`;

      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${systemPrompt}\n\nRecent Conversation History:\n${history.slice(-6).map((h) => `${h.role}: ${h.content}`).join("\n")}\n\nStudent: ${message}\nAssistant:`,
        config: {
          temperature: 0.3,
        },
      });

      return response.text || this.generateDeterministicChatReply({ studentName, message, academicContext });
    } catch (err) {
      console.warn("[AiCurriculum] Gemini chat invocation error, falling back to deterministic response:", err.message);
      return this.generateDeterministicChatReply({ studentName, message, academicContext });
    }
  }
}

export default AiCurriculumService;
