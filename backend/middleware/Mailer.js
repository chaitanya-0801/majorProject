import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

export default class Mailer {
  static async sendMail(to, subject, text) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      const mailOptions = {
        from: `"AttendEase" <${process.env.EMAIL}>`,
        to,
        subject,
        text,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log("Mail Sent:", info.response);

      return info;
    } catch (error) {
      console.log("Mail Error:", error);
      return false;
    }
  }
}
