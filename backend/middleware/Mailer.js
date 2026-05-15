import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

export default class Mailer {
  static async sendMail(to, subject, text) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      const mailOptions = {
        from: {
          name: "AttendEase",
          address: process.env.EMAIL,
        },
        to,
        subject,
        text,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log(info);

      return info;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
