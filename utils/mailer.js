const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from:    `"SoftBricksAI" <${process.env.EMAIL_FROM}>`,
    to, subject, html, text,
  });
};

const sendReply = async ({ to, name, subject, replyText }) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
      <h2 style="color:#3b82f6;margin-bottom:8px;">SoftBricksAI</h2>
      <p>Hi ${name},</p>
      <div style="background:#1e293b;padding:20px;border-radius:8px;border-left:4px solid #3b82f6;white-space:pre-wrap;margin:20px 0;">
        ${replyText}
      </div>
      <hr style="border:none;border-top:1px solid #334155;margin:24px 0;"/>
      <p style="color:#64748b;font-size:12px;">SoftBricksAI · Engineering Reliable Software Infrastructure</p>
    </div>
  `;
  return sendEmail({ to, subject: `Re: ${subject}`, html, text: replyText });
};

const notifyAdmin = async ({ name, email, subject, type }) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#3b82f6;">New ${type} received</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <a href="${process.env.CLIENT_URL}/admin/messages" style="color:#3b82f6;">View in dashboard →</a>
    </div>
  `;
  return sendEmail({
    to:      process.env.ADMIN_EMAIL,
    subject: `[SoftBricksAI] New ${type}: ${subject}`,
    html,
  });
};

module.exports = { sendEmail, sendReply, notifyAdmin };