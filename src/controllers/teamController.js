const { validationResult } = require('express-validator');
const TeamMember = require('../models/TeamMember');
const { logActivity } = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

const teamController = {
  async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const members = await TeamMember.getAll(limit, offset);
      res.json({ success: true, data: members });
    } catch (error) {
      console.error('Get team members error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch team members' });
    }
  },

  async getActive(req, res) {
    try {
      const members = await TeamMember.getActive();
      res.json({ success: true, data: members });
    } catch (error) {
      console.error('Get active team members error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch active team members' });
    }
  },

  async getById(req, res) {
    try {
      const member = await TeamMember.getById(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, error: 'Team member not found' });
      }
      res.json({ success: true, data: member });
    } catch (error) {
      console.error('Get team member error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch team member' });
    }
  },

  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      let avatarPath = null;
      if (req.file) {
        avatarPath = '/team/' + req.file.filename;
      }
      
      const memberData = {
        name: req.body.name,
        role: req.body.role || null,
        department: req.body.department || null,
        bio: req.body.bio || null,
        avatar: req.body.avatar || null,
        email: req.body.email || null,
        linkedin: req.body.linkedin || null,
        twitter: req.body.twitter || null,
        location: req.body.location || null,
        joined: req.body.joined || null,
        status: req.body.status || 'Active',
        display_order: parseInt(req.body.display_order) || 0
      };
      
      const member = await TeamMember.create(memberData, req.admin.id, avatarPath);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'CREATE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: member.id,
        details: { name: member.name, avatar: avatarPath },
        ip: req.ip
      });
      
      res.status(201).json({ success: true, data: member, message: 'Team member created successfully' });
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }
      console.error('Create team member error:', error);
      res.status(500).json({ success: false, error: 'Failed to create team member: ' + error.message });
    }
  },

  async update(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }
      console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const existing = await TeamMember.getById(req.params.id);
      if (!existing) {
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error('Failed to delete file:', unlinkError);
          }
        }
        return res.status(404).json({ success: false, error: 'Team member not found' });
      }
      
      let avatarPath = null;
      if (req.file) {
        avatarPath = '/team/' + req.file.filename;
        if (existing.avatar && existing.avatar.includes('/team/')) {
          const oldPath = path.join(__dirname, '../../uploads', existing.avatar);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (unlinkError) {
              console.error('Failed to delete old avatar:', unlinkError);
            }
          }
        }
      }
      
      const memberData = {};
      if (req.body.name !== undefined) memberData.name = req.body.name;
      if (req.body.role !== undefined) memberData.role = req.body.role;
      if (req.body.department !== undefined) memberData.department = req.body.department;
      if (req.body.bio !== undefined) memberData.bio = req.body.bio;
      if (req.body.avatar !== undefined) memberData.avatar = req.body.avatar;
      if (req.body.email !== undefined) memberData.email = req.body.email;
      if (req.body.linkedin !== undefined) memberData.linkedin = req.body.linkedin;
      if (req.body.twitter !== undefined) memberData.twitter = req.body.twitter;
      if (req.body.location !== undefined) memberData.location = req.body.location;
      if (req.body.joined !== undefined) memberData.joined = req.body.joined;
      if (req.body.status !== undefined) memberData.status = req.body.status;
      if (req.body.display_order !== undefined) memberData.display_order = parseInt(req.body.display_order);
      
      const member = await TeamMember.update(req.params.id, memberData, req.admin.id, avatarPath);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'UPDATE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: member.id,
        details: { name: member.name },
        ip: req.ip
      });
      
      res.json({ success: true, data: member, message: 'Team member updated successfully' });
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }
      console.error('Update team member error:', error);
      res.status(500).json({ success: false, error: 'Failed to update team member: ' + error.message });
    }
  },

  async delete(req, res) {
    try {
      const existing = await TeamMember.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Team member not found' });
      }
      
      if (existing.avatar && existing.avatar.includes('/team/')) {
        const oldPath = path.join(__dirname, '../../uploads', existing.avatar);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (unlinkError) {
            console.error('Failed to delete avatar file:', unlinkError);
          }
        }
      }
      
      await TeamMember.delete(req.params.id);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'DELETE_TEAM_MEMBER',
        entity: 'team_members',
        entityId: req.params.id,
        details: { name: existing.name },
        ip: req.ip
      });
      
      res.json({ success: true, message: 'Team member deleted successfully' });
    } catch (error) {
      console.error('Delete team member error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete team member: ' + error.message });
    }
  },

  async updateOrder(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      await TeamMember.updateOrder(req.body.orders);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'REORDER_TEAM_MEMBERS',
        entity: 'team_members',
        details: { orders: req.body.orders },
        ip: req.ip
      });
      
      res.json({ success: true, message: 'Team members reordered successfully' });
    } catch (error) {
      console.error('Reorder team members error:', error);
      res.status(500).json({ success: false, error: 'Failed to reorder team members: ' + error.message });
    }
  }
};

module.exports = teamController;