import nodemailer from "nodemailer";
import { env } from "./env.js";

let transporter = null;

export const initEmailTransporter = () => {
  const {
    host: SMTP_HOST,
    port: SMTP_PORT,
    email: SMTP_EMAIL,
    password: SMTP_PASSWORD,
  } = env.smtp;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_EMAIL || !SMTP_PASSWORD) {
    console.warn("⚠️  Email configuration incomplete. Email feature disabled.");
    console.warn(
      "   Required: SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD"
    );
    console.warn(
      `   Found: HOST=${!!SMTP_HOST}, PORT=${!!SMTP_PORT}, EMAIL=${!!SMTP_EMAIL}, PASSWORD=${!!SMTP_PASSWORD}`
    );
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    });

    console.log("✅ Email transporter initialized");
    return transporter;
  } catch (error) {
    console.error("❌ Failed to initialize email transporter:", error);
    return null;
  }
};

export const getEmailTransporter = () => {
  if (!transporter) {
    transporter = initEmailTransporter();
  }
  return transporter;
};

export const sendEmail = async (options) => {
  const transporter = getEmailTransporter();

  if (!transporter) {
    throw new Error("Email service is not configured");
  }

  return await transporter.sendMail({
    from: env.smtp.email,
    ...options,
  });
};
