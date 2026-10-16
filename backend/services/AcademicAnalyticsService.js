import { AttendanceRecord } from "../model/AttendanceRecord.js";
import { Course } from "../model/Course.js";
import { AssessmentResult } from "../model/AssessmentResult.js";

/**
 * Deterministic Academic Analytics Service
 * Pure mathematical calculations and rule-based learning gap detection.
 */
export class AcademicAnalyticsService {
  /**
   * Pure mathematical calculation: minimum consecutive upcoming classes student must attend to reach target (default 75%)
   */
  static calculateConsecutiveClassesNeeded(attended, total, target = 0.75) {
    if (total <= 0) return 0;
    const currentRatio = attended / total;
    if (currentRatio >= target) return 0;
    const numerator = target * total - attended;
    const denominator = 1 - target;
    return Math.max(0, Math.ceil(numerator / denominator));
  }

  /**
   * Pure mathematical calculation: maximum upcoming classes student can safely miss while maintaining target (default 75%)
   */
  static calculateSafeClassesCanMiss(attended, total, target = 0.75) {
    if (total <= 0) return 0;
    const currentRatio = attended / total;
    if (currentRatio < target) return 0;
    const numerator = attended - target * total;
    return Math.max(0, Math.floor(numerator / target));
  }

  /**
   * Calculate student attendance metrics overall and per-subject with 75% threshold projections
   */
  static async calculateStudentAttendance(studentEmail) {
    const cleanEmail = studentEmail.trim().toLowerCase();
    const records = await AttendanceRecord.find({ student_email: cleanEmail });

    if (!records || records.length === 0) {
      return {
        totalSessionsAttended: 0,
        totalSessionsScheduled: 0,
        overallPercentage: 0,
        overallStatus: "Critical Shortage",
        consecutiveNeededToReach75: 0,
        safeClassesCanMiss: 0,
        subjectWise: [],
        attendanceWarning: true,
        warningMessage: "No attendance records found. Immediate attention required to meet 75% requirement.",
      };
    }

    const subjectMap = {};
    for (const record of records) {
      const subject = record.subject_name || "General Lecture";
      if (!subjectMap[subject]) {
        subjectMap[subject] = { attended: 0, total: 0 };
      }
      subjectMap[subject].total += 1;
      if (record.status === "present" || record.status === "late") {
        subjectMap[subject].attended += 1;
      }
    }

    let totalAttended = 0;
    let totalSessions = 0;
    const subjectWise = Object.keys(subjectMap).map((subject) => {
      const data = subjectMap[subject];
      totalAttended += data.attended;
      totalSessions += data.total;
      const percentage = Math.round((data.attended / data.total) * 100);

      const consecutiveNeeded = this.calculateConsecutiveClassesNeeded(data.attended, data.total, 0.75);
      const safeCanMiss = this.calculateSafeClassesCanMiss(data.attended, data.total, 0.75);

      // What happens if student misses the very next class
      const projectedIfMissNext = Math.round((data.attended / (data.total + 1)) * 100);
      const consecutiveNeededIfMissNext = this.calculateConsecutiveClassesNeeded(data.attended, data.total + 1, 0.75);

      let status = "On Track";
      if (percentage < 65) {
        status = "Critical Shortage";
      } else if (percentage < 75) {
        status = "At Risk";
      }

      return {
        subject,
        attended: data.attended,
        total: data.total,
        percentage,
        isShortage: percentage < 75,
        status, // "On Track" | "At Risk" | "Critical Shortage"
        consecutiveNeededToReach75: consecutiveNeeded,
        safeClassesCanMiss: safeCanMiss,
        projectedIfMissNext,
        consecutiveNeededIfMissNext,
        explanation: percentage >= 75
          ? `Your attendance is ${percentage}% (On Track). You can safely miss up to ${safeCanMiss} class(es) while maintaining 75%.`
          : `Your attendance is ${percentage}% (${status}). You must attend the next ${consecutiveNeeded} consecutive class(es) to reach 75%.`,
      };
    });

    const overallPercentage = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;
    const isWarning = overallPercentage < 75;
    const overallConsecutiveNeeded = this.calculateConsecutiveClassesNeeded(totalAttended, totalSessions, 0.75);
    const overallSafeCanMiss = this.calculateSafeClassesCanMiss(totalAttended, totalSessions, 0.75);

    let overallStatus = "On Track";
    if (overallPercentage < 65) {
      overallStatus = "Critical Shortage";
    } else if (overallPercentage < 75) {
      overallStatus = "At Risk";
    }

    return {
      totalSessionsAttended: totalAttended,
      totalSessionsScheduled: totalSessions,
      overallPercentage,
      overallStatus,
      consecutiveNeededToReach75: overallConsecutiveNeeded,
      safeClassesCanMiss: overallSafeCanMiss,
      subjectWise,
      attendanceWarning: isWarning,
      warningMessage: isWarning
        ? `Warning: Your overall attendance is ${overallPercentage}% (${overallStatus}). You need to attend ${overallConsecutiveNeeded} consecutive sessions without absence to attain 75%.`
        : `Overall attendance is in good standing at ${overallPercentage}%. You have a buffer of ${overallSafeCanMiss} class(es).`,
    };
  }

  /**
   * Calculate academic assessment performance and identify weak topics
   */
  static async calculateAcademicPerformance(studentEmail) {
    const cleanEmail = studentEmail.trim().toLowerCase();
    const results = await AssessmentResult.find({ student_email: cleanEmail }).sort({ createdAt: -1 });

    if (!results || results.length === 0) {
      return {
        overallAverage: 0,
        assessmentsTaken: 0,
        strengths: [],
        weakTopics: [],
        topicBreakdown: [],
        subjectsPerformance: [],
      };
    }

    let totalEarned = 0;
    let totalPossible = 0;
    const subjectScores = {};
    const topicScores = {};

    for (const res of results) {
      totalEarned += res.total_score;
      totalPossible += res.max_marks;

      const code = res.course_code || "General";
      if (!subjectScores[code]) {
        subjectScores[code] = { earned: 0, possible: 0, count: 0 };
      }
      subjectScores[code].earned += res.total_score;
      subjectScores[code].possible += res.max_marks;
      subjectScores[code].count += 1;

      for (const tb of res.topic_breakdown || []) {
        const tid = tb.topic_id;
        if (!topicScores[tid]) {
          topicScores[tid] = {
            topic_id: tid,
            topic_title: tb.topic_title,
            course_code: code,
            earned: 0,
            possible: 0,
          };
        }
        topicScores[tid].earned += tb.score;
        topicScores[tid].possible += tb.max_score;
      }
    }

    const overallAverage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    const subjectsPerformance = Object.keys(subjectScores).map((code) => {
      const s = subjectScores[code];
      const percentage = s.possible > 0 ? Math.round((s.earned / s.possible) * 100) : 0;
      return {
        course_code: code,
        assessmentsTaken: s.count,
        percentage,
        status: percentage >= 75 ? "good" : percentage >= 50 ? "average" : "at_risk",
      };
    });

    const topicBreakdown = Object.values(topicScores).map((t) => {
      const percentage = t.possible > 0 ? Math.round((t.earned / t.possible) * 100) : 0;
      let masteryLevel = "proficient";
      let severity = "minor";

      if (percentage >= 80) {
        masteryLevel = "mastered";
      } else if (percentage >= 65) {
        masteryLevel = "proficient";
      } else if (percentage >= 50) {
        masteryLevel = "needs_improvement";
        severity = "moderate";
      } else {
        masteryLevel = "critical_gap";
        severity = "critical";
      }

      return {
        topic_id: t.topic_id,
        topic_title: t.topic_title,
        course_code: t.course_code,
        percentage,
        masteryLevel,
        severity,
      };
    });

    const strengths = topicBreakdown
      .filter((t) => t.percentage >= 75)
      .map((t) => t.topic_title);

    const weakTopics = topicBreakdown
      .filter((t) => t.percentage < 65)
      .sort((a, b) => a.percentage - b.percentage);

    return {
      overallAverage,
      assessmentsTaken: results.length,
      strengths,
      weakTopics,
      topicBreakdown,
      subjectsPerformance,
    };
  }

  /**
   * Calculate syllabus completion metrics
   */
  static async calculateSyllabusProgress(courseCode, completedTopicIds = []) {
    const course = await Course.findOne({ code: courseCode });
    if (!course) return { totalTopics: 0, completedTopics: 0, completionPercentage: 0 };

    let totalTopics = 0;
    const allTopics = [];

    for (const unit of course.units || []) {
      for (const topic of unit.topics || []) {
        totalTopics += 1;
        allTopics.push({
          topic_id: topic.topic_id,
          title: topic.title,
          unit_number: unit.unit_number,
          unit_title: unit.unit_title,
          isCompleted: completedTopicIds.includes(topic.topic_id),
        });
      }
    }

    const completedCount = allTopics.filter((t) => t.isCompleted).length;
    const completionPercentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

    return {
      courseCode,
      courseName: course.name,
      totalTopics,
      completedTopics: completedCount,
      completionPercentage,
      topics: allTopics,
    };
  }

  /**
   * Class-wide learning gaps for teacher dashboard
   */
  static async calculateClassGaps(courseCode) {
    const results = await AssessmentResult.find({ course_code: courseCode });
    const topicStats = {};

    for (const res of results) {
      for (const tb of res.topic_breakdown || []) {
        const tid = tb.topic_id;
        if (!topicStats[tid]) {
          topicStats[tid] = {
            topic_id: tid,
            topic_title: tb.topic_title,
            studentCount: 0,
            totalPercentage: 0,
            strugglingStudents: 0,
          };
        }
        topicStats[tid].studentCount += 1;
        topicStats[tid].totalPercentage += tb.percentage;
        if (tb.percentage < 60) {
          topicStats[tid].strugglingStudents += 1;
        }
      }
    }

    const classGaps = Object.values(topicStats).map((t) => {
      const avgPercentage = t.studentCount > 0 ? Math.round(t.totalPercentage / t.studentCount) : 0;
      return {
        topic_id: t.topic_id,
        topic_title: t.topic_title,
        averageScore: avgPercentage,
        strugglingCount: t.strugglingStudents,
        totalEvaluated: t.studentCount,
        requiresRevision: avgPercentage < 65,
      };
    }).sort((a, b) => a.averageScore - b.averageScore);

    return classGaps;
  }
}

export default AcademicAnalyticsService;
