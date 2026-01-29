import nodemailer from "nodemailer";
import config from "../config";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port),
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const primaryColor = "#22c55e"; // Fallback for oklch(0.72 0.16 135) - Green
const backgroundColor = "#ffffff";
const foregroundColor = "#1f2937";

const getEmailTemplate = (content: string, title: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: ${backgroundColor};
          color: ${foregroundColor};
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid ${primaryColor};
          margin-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: ${primaryColor};
          text-decoration: none;
        }
        .content {
          line-height: 1.6;
          font-size: 16px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .btn {
          display: inline-block;
          background-color: ${primaryColor};
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="#" class="logo">ProFlow</a>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${content}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ProFlow. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const formattedHtml = getEmailTemplate(html, subject);
    const info = await transporter.sendMail({
      from: `"ProFlow" <${config.email.from}>`,
      to,
      subject,
      html: formattedHtml,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendOTPEmail = async (to: string, otp: string, type: "RESET_PASSWORD" | "VERIFY_EMAIL" = "RESET_PASSWORD") => {
  const isReset = type === "RESET_PASSWORD";
  const subject = isReset ? "Your Password Reset OTP" : "Verify Your Email";
  const title = isReset ? "Password Reset OTP" : "Email Verification";
  const message = isReset 
    ? "You requested a password reset. Use the OTP below to proceed:" 
    : "Welcome to ProFlow! Please verify your email address using the OTP below:";

  const content = `
    <p>Hello,</p>
    <p>${message}</p>
    <div style="font-size: 32px; font-weight: bold; color: ${primaryColor}; text-align: center; margin: 20px 0;">
      ${otp}
    </div>
    <p>This OTP is valid for 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  const html = getEmailTemplate(content, title);
  await sendEmail(to, subject, html);
};

export const sendRoleAssignedEmail = async (to: string, role: string) => {
  const subject = "Role Update Notification";
  const content = `
    <p>Hello,</p>
    <p>Congratulations! Your role has been updated to <strong>${role}</strong>.</p>
    <p>You now have access to new features and capabilities in the ProFlow marketplace.</p>
    <a href="https://proflow.com/dashboard" class="btn">Go to Dashboard</a>
  `;
  const html = getEmailTemplate(content, "Role Updated");
  await sendEmail(to, subject, html);
};
