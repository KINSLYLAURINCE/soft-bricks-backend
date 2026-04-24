const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const AdminUser = require('../models/AdminUser');
const { logActivity } = require('../../utils/logger');

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const authController = {
  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const admin = await AdminUser.findByEmail(email);
      
      if (!admin) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      await AdminUser.updateLastLogin(admin.id);
      
      const token = generateToken(admin);
      
      await logActivity({
        adminId: admin.id,
        action: 'LOGIN',
        entity: 'admin_users',
        entityId: admin.id,
        details: { email: admin.email },
        ip: req.ip
      });

      const { password_hash, ...adminWithoutPassword } = admin;
      
      res.json({
        success: true,
        data: {
          token,
          admin: adminWithoutPassword
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  },

  async getProfile(req, res) {
    try {
      const admin = await AdminUser.findById(req.admin.id);
      
      if (!admin) {
        return res.status(404).json({ success: false, error: 'Admin not found' });
      }
      
      res.json({ success: true, data: admin });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
  },

  async updateProfile(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const updated = await AdminUser.updateProfile(req.admin.id, req.body);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'UPDATE_PROFILE',
        entity: 'admin_users',
        entityId: req.admin.id,
        details: req.body,
        ip: req.ip
      });
      
      res.json({ success: true, data: updated, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  },

  async changePassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const admin = await AdminUser.findByEmail(req.admin.email);
      
      const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }
      
      await AdminUser.changePassword(req.admin.id, newPassword);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'CHANGE_PASSWORD',
        entity: 'admin_users',
        entityId: req.admin.id,
        ip: req.ip
      });
      
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  },

  async getAllAdmins(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      const admins = await AdminUser.getAll(limit, offset);
      
      res.json({ success: true, data: admins });
    } catch (error) {
      console.error('Get admins error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch admins' });
    }
  }
};

module.exports = authController;