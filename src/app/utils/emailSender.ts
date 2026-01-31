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

const primaryColor = "#10B981"; // Fallback for oklch(0.72 0.16 135) - Emerald/Green
const primaryColorCSS = "oklch(0.72 0.16 135)";
const backgroundColor = "#ffffff";
const foregroundColor = "#1f2937";
const grayColor = "#6b7280";

const getEmailTemplate = (content: string, title: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        /* Reset styles */
        body, html {
          margin: 0;
          padding: 0;
          width: 100% !important;
          height: 100% !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
        }
        
        /* Container */
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: #f3f4f6;
          padding-bottom: 40px;
        }
        
        .main {
          background-color: ${backgroundColor};
          margin: 0 auto;
          width: 100%;
          max-width: 600px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
        }
        
        /* Header */
        .header {
          padding: 30px 40px;
          text-align: center;
          background-color: #ffffff;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: ${primaryColor};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .logo-text {
          background: linear-gradient(135deg, ${primaryColor} 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: ${primaryColor}; /* Fallback */
        }
        
        /* Content */
        .content {
          padding: 40px;
          color: ${foregroundColor};
          line-height: 1.6;
          font-size: 16px;
        }
        
        h1 {
          color: #111827;
          font-size: 24px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 24px;
          text-align: center;
        }
        
        p {
          margin-bottom: 16px;
          color: #374151;
        }
        
        /* OTP Box */
        .otp-box {
          background-color: #f0fdf4;
          border: 2px dashed ${primaryColor};
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin: 32px 0;
        }
        
        .otp-code {
          font-size: 36px;
          font-weight: 800;
          color: ${primaryColor};
          letter-spacing: 4px;
          margin: 0;
          font-family: 'Courier New', Courier, monospace;
        }
        
        /* Button */
        .btn {
          display: inline-block;
          background-color: ${primaryColor};
          color: white !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          text-align: center;
          margin-top: 24px;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);
          transition: transform 0.2s;
        }
        
        /* Footer */
        .footer {
          background-color: #f9fafb;
          padding: 30px 40px;
          text-align: center;
          font-size: 12px;
          color: ${grayColor};
          border-top: 1px solid #f3f4f6;
        }
        
        .footer p {
          margin-bottom: 8px;
          color: ${grayColor};
        }
        
        .social-links {
          margin-top: 16px;
        }
        
        .social-links a {
          color: ${grayColor};
          text-decoration: none;
          margin: 0 8px;
        }
        
        @media only screen and (max-width: 600px) {
          .main {
            width: 100% !important;
            border-radius: 0 !important;
          }
          .content {
            padding: 24px !important;
          }
          .header {
            padding: 24px !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <br>
        <div class="main">
          <div class="header">
            <a href="#" class="logo">
              <!-- Placeholder for logo image if available, using CSS styled text for now -->
              <span class="logo-text">ProFlow</span>
            </a>
          </div>
          <div class="content">
            <h1>${title}</h1>
            ${content}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ProFlow. All rights reserved.</p>
            <p>You received this email because you signed up for ProFlow.</p>
            <p>123 Project Street, Tech City, TC 90210</p>
          </div>
        </div>
        <br>
      </div>
    </body>
    </html>
  `;
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // Only wrap in template if it doesn't look like a full HTML document already
    // But for consistency, we assume the input 'html' is just the body content if called from outside services
    // However, our refactoring plan is to move template wrapping to sendEmail and pass raw content.
    
    // Wait, if I change sendEmail to wrap content, I need to make sure I don't break other calls if they expect to pass full HTML.
    // But currently only sendOTPEmail and sendRoleAssignedEmail use it.
    
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
  // The title inside the email
  const title = isReset ? "Reset Your Password" : "Verify Your Email";
  
  const message = isReset 
    ? "You requested a password reset. Use the OTP below to proceed with resetting your password." 
    : "Welcome to ProFlow! To get started, please verify your email address using the secure code below.";

  // Just return the inner content, sendEmail will wrap it
  const content = `
    <p>Hello,</p>
    <p>${message}</p>
    
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
    <p style="text-align: center; color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
  `;
  
  // Note: sendEmail will wrap this content in getEmailTemplate using 'subject' as the title.
  // Wait, sendEmail uses 'subject' as title. 
  // Subject is "Verify Your Email". 
  // Title I wanted was "Verify Your Email". Matches.
  
  await sendEmail(to, subject, content);
};

export const sendRoleAssignedEmail = async (to: string, role: string) => {
  const subject = "Role Update Notification";
  const content = `
    <p>Hello,</p>
    <p>Congratulations! Your account role has been successfully updated to <strong style="color: ${primaryColor};">${role}</strong>.</p>
    <p>You now have access to exclusive features and capabilities in the ProFlow marketplace tailored to your new role.</p>
    <div style="text-align: center;">
      <a href="${config.supabase.url /* Just a placeholder or should be frontend URL */}" class="btn">Go to Dashboard</a>
    </div>
  `;
  
  await sendEmail(to, subject, content);
};
