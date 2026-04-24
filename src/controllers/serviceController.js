const { validationResult } = require('express-validator');
const Service = require('../models/Service');
const { logActivity } = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

const serviceController = {
  async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const services = await Service.getAll(limit, offset);
      res.json({ success: true, data: services });
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
  },

  async getFeatured(req, res) {
    try {
      const services = await Service.getFeatured();
      res.json({ success: true, data: services });
    } catch (error) {
      console.error('Get featured services error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch featured services' });
    }
  },

  async getBySlug(req, res) {
    try {
      const service = await Service.getBySlug(req.params.slug);
      if (!service) {
        return res.status(404).json({ success: false, error: 'Service not found' });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      console.error('Get service by slug error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch service' });
    }
  },

  async getById(req, res) {
    try {
      const service = await Service.getById(req.params.id);
      if (!service) {
        return res.status(404).json({ success: false, error: 'Service not found' });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      console.error('Get service error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch service' });
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
      let imagePath = null;
      if (req.file) {
        imagePath = '/services/' + req.file.filename;
      }
      
      let techStack = req.body.tech_stack;
      if (techStack && typeof techStack === 'string') {
        try {
          techStack = JSON.parse(techStack);
        } catch (e) {
          techStack = [techStack];
        }
      }
      
      let featured = req.body.featured === 'true' || req.body.featured === true;
      
      const serviceData = {
        title: req.body.title,
        title_fr: req.body.title_fr || null,
        slug: req.body.slug,
        description: req.body.description || null,
        description_fr: req.body.description_fr || null,
        details: req.body.details || null,
        details_fr: req.body.details_fr || null,
        icon: req.body.icon || null,
        image: req.body.image || null,
        tech_stack: techStack || [],
        featured: featured,
        display_order: parseInt(req.body.display_order) || 0
      };
      
      const service = await Service.create(serviceData, req.admin.id, imagePath);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'CREATE_SERVICE',
        entity: 'services',
        entityId: service.id,
        details: { title: service.title },
        ip: req.ip
      });
      
      res.status(201).json({ success: true, data: service, message: 'Service created successfully' });
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }
      console.error('Create service error:', error);
      res.status(500).json({ success: false, error: 'Failed to create service: ' + error.message });
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
      const existing = await Service.getById(req.params.id);
      if (!existing) {
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error('Failed to delete file:', unlinkError);
          }
        }
        return res.status(404).json({ success: false, error: 'Service not found' });
      }
      
      let imagePath = null;
      if (req.file) {
        imagePath = '/services/' + req.file.filename;
        if (existing.image && existing.image.includes('/services/')) {
          const oldPath = path.join(__dirname, '../../uploads', existing.image);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (unlinkError) {
              console.error('Failed to delete old image:', unlinkError);
            }
          }
        }
      }
      
      let techStack = req.body.tech_stack;
      if (techStack && typeof techStack === 'string') {
        try {
          techStack = JSON.parse(techStack);
        } catch (e) {
          techStack = [techStack];
        }
      }
      
      let featured = req.body.featured === 'true' || req.body.featured === true;
      
      const serviceData = {};
      if (req.body.title !== undefined) serviceData.title = req.body.title;
      if (req.body.title_fr !== undefined) serviceData.title_fr = req.body.title_fr;
      if (req.body.slug !== undefined) serviceData.slug = req.body.slug;
      if (req.body.description !== undefined) serviceData.description = req.body.description;
      if (req.body.description_fr !== undefined) serviceData.description_fr = req.body.description_fr;
      if (req.body.details !== undefined) serviceData.details = req.body.details;
      if (req.body.details_fr !== undefined) serviceData.details_fr = req.body.details_fr;
      if (req.body.icon !== undefined) serviceData.icon = req.body.icon;
      if (req.body.image !== undefined) serviceData.image = req.body.image;
      if (techStack !== undefined) serviceData.tech_stack = techStack;
      if (featured !== undefined) serviceData.featured = featured;
      if (req.body.display_order !== undefined) serviceData.display_order = parseInt(req.body.display_order);
      
      const service = await Service.update(req.params.id, serviceData, req.admin.id, imagePath);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'UPDATE_SERVICE',
        entity: 'services',
        entityId: service.id,
        details: { title: service.title },
        ip: req.ip
      });
      
      res.json({ success: true, data: service, message: 'Service updated successfully' });
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }
      console.error('Update service error:', error);
      res.status(500).json({ success: false, error: 'Failed to update service: ' + error.message });
    }
  },

  async delete(req, res) {
    try {
      const existing = await Service.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Service not found' });
      }
      
      await Service.delete(req.params.id);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'DELETE_SERVICE',
        entity: 'services',
        entityId: req.params.id,
        details: { title: existing.title },
        ip: req.ip
      });
      
      res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Delete service error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete service: ' + error.message });
    }
  },

  async updateOrder(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      await Service.updateOrder(req.body.orders);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'REORDER_SERVICES',
        entity: 'services',
        details: { orders: req.body.orders },
        ip: req.ip
      });
      
      res.json({ success: true, message: 'Services reordered successfully' });
    } catch (error) {
      console.error('Reorder services error:', error);
      res.status(500).json({ success: false, error: 'Failed to reorder services: ' + error.message });
    }
  }
};

module.exports = serviceController;