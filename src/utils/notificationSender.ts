import nodemailer from "nodemailer";
import config from "../app/config";

const primaryColor = "oklch(0.72 0.16 135)";
const backgroundColor = "oklch(1 0 0)";
const foregroundColor = "oklch(0.2 0.02 240)";

const getEmailTemplate = (content: string, title: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Inter', Arial, sans-serif;
          background-color: #f0f4f8;
          margin: 0;
          padding: 20px;
          color: ${foregroundColor};
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: ${backgroundColor};
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: ${primaryColor};
          text-align: center;
          padding: 35px 20px;
          color: white;
        }
        .header h1 {
          font-size: 28px;
          margin: 10px 0;
          font-weight: 700;
        }
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .description {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.5;
          margin-bottom: 30px;
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
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          font-size: 12px;
          color: #6b7280;
          margin: 4px 0;
        }
        .company {
          font-weight: 600;
          color: ${foregroundColor};
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ProFlow</h1>
          <p>Marketplace Project Workflow System</p>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <div class="description">${content}</div>
        </div>
        <div class="footer">
          <p class="company">© ${new Date().getFullYear()} ProFlow. All Rights Reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: Number(config.email.port),
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  await transporter.sendMail({
    from: `"ProFlow" <${config.email.from}>`,
    to,
    subject,
    html,
  });
};

export const sendNotificationEmail = async (
  to: string,
  subject: string,
  message: string,
  actionLink?: string,
  actionText?: string,
) => {
  let content = `<p>${message}</p>`;
  if (actionLink && actionText) {
    content += `<a href="${actionLink}" class="btn">${actionText}</a>`;
  }
  const html = getEmailTemplate(content, subject);
  await sendEmail(to, subject, html);
};
