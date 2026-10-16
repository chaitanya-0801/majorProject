import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g., "ATTENDANCE_CORRECTED", "SESSION_DELETED", "ROLE_UPDATED"
    performed_by: { type: String, required: true }, // email of actor
    role: { type: String, required: true }, // teacher, admin, etc.
    target_entity: { type: String, required: true }, // e.g. "attendance_record_123"
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip_address: { type: String, default: "unknown" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
