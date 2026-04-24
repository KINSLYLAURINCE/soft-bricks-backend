require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('SMTP Host:', process.env.SMTP_HOST);
  console.log('SMTP Port:', process.env.SMTP_PORT);
  console.log('SMTP User:', process.env.SMTP_USER);
  console.log('SMTP Password length:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true,
  });
  
  try {
    await transporter.verify();
    console.log('SMTP connection successful');
    
    const info = await transporter.sendMail({
      from: `"SoftBricksAI" <${process.env.EMAIL_FROM}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email from SoftBricksAI',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<h2>Test Email</h2><p>Your SMTP configuration is working correctly.</p>',
    });
    
    console.log('Email sent successfully:', info.messageId);
  } catch (err) {
    console.error('Email failed:', err.message);
  }
}

testEmail();