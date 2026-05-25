import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: "Test Email from Script",
  text: "If you get this, Nodemailer is working!"
}).then(info => {
  console.log("Success:", info.response);
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
