import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

export default class Mailer {
  static async sendMail(email, subject, htmlContent) {
    try {
      if (!process.env.EMAIL || !process.env.PASSWORD) {
        console.warn(`[Mailer] EMAIL or PASSWORD not set. Email to ${email} skipped. Content: ${htmlContent}`);
        return { success: true, simulated: true };
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from: `"AttendEase" <${process.env.EMAIL}>`,
        to: email,
        subject,
        html: htmlContent,
      });

      console.log(`[Mailer] Message sent to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("[Mailer] Email delivery failure:", error.message);
      return { success: false, error: error.message };
    }
  }
}
