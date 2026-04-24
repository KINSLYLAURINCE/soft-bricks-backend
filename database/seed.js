require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { sendEmail } = require('../utils/mailer');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding admin user only...');

    const exists = await client.query('SELECT id FROM admin_users WHERE email = $1', [process.env.ADMIN_EMAIL]);
    let adminId;
    
    if (exists.rows.length > 0) {
      adminId = exists.rows[0].id;
      console.log('Admin already exists, skipping.');
    } else {
      adminId = uuidv4();
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await client.query(
        `INSERT INTO admin_users (id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, 'super_admin')`,
        [adminId, process.env.ADMIN_EMAIL, hash, process.env.ADMIN_USERNAME]
      );
      console.log(`Admin user created: ${process.env.ADMIN_EMAIL}`);
      
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: 'SoftBricksAI Admin Account Created',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
              <h2 style="color: #3b82f6;">Welcome to SoftBricksAI Admin</h2>
              <p>Your admin account has been created successfully.</p>
              <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Login Email:</strong> ${process.env.ADMIN_EMAIL}</p>
                <p><strong>Password:</strong> ${process.env.ADMIN_PASSWORD}</p>
                <p><strong>Login URL:</strong> ${process.env.CLIENT_URL}/admin-login</p>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">Please change your password after first login.</p>
              <hr style="border-color: #334155; margin: 20px 0;">
              <p style="color: #64748b; font-size: 12px;">SoftBricksAI - Engineering Reliable Software Infrastructure</p>
            </div>
          `,
          text: `Welcome to SoftBricksAI Admin\n\nYour admin account has been created.\n\nLogin Email: ${process.env.ADMIN_EMAIL}\nPassword: ${process.env.ADMIN_PASSWORD}\nLogin URL: ${process.env.CLIENT_URL}/admin-login\n\nPlease change your password after first login.`
        });
        console.log('Admin credentials sent via email');
      } catch (emailErr) {
        console.log('Email not sent:', emailErr.message);
        console.log(`Admin credentials - Email: ${process.env.ADMIN_EMAIL}, Password: ${process.env.ADMIN_PASSWORD}`);
      }
    }

    console.log('Admin seeding complete');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();