import { sendEmail } from "./emailSender";

export const sendNotificationEmail = async (
  to: string,
  subject: string,
  message: string,
  actionUrl?: string,
  actionText?: string
) => {
  let htmlContent = `<p>${message}</p>`;

  if (actionUrl && actionText) {
    htmlContent += `
      <div style="text-align: center;">
        <a href="${actionUrl}" class="btn">${actionText}</a>
      </div>
    `;
  }

  // We rely on emailSender's internal template wrapping, but wait, 
  // emailSender.ts's sendEmail takes 'html' and wraps it?
  // Let's check emailSender.ts again. 
  // No, sendEmail (lines 88-101) takes 'html' and passes it directly to transporter.sendMail.
  // BUT, lines 18-86 define getEmailTemplate, but it is NOT exported and NOT used in sendEmail!
  // This is a bug in emailSender.ts.
  
  // I should fix emailSender.ts first to use the template, OR use the template here.
  // Since getEmailTemplate is not exported, I should probably update emailSender.ts to use it.
  
  return sendEmail(to, subject, htmlContent);
};
