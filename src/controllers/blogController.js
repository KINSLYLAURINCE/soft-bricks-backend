const { validationResult } = require('express-validator');
const BlogPost = require('../models/BlogPost');
const { logActivity } = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

const blogController = {
  async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      const status = req.query.status || null;
      const posts = await BlogPost.getAll(limit, offset, status);
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error('Get blog posts error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch blog posts' });
    }
  },

  async getPublished(req, res) {
    try {
      const posts = await BlogPost.getPublished();
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error('Get published posts error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch published posts' });
    }
  },

  async getBySlug(req, res) {
    try {
      const post = await BlogPost.getBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
      await BlogPost.incrementViews(post.id);
      post.views = (post.views || 0) + 1;
      res.json({ success: true, data: post });
    } catch (error) {
      console.error('Get blog post by slug error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch blog post' });
    }
  },

  async getById(req, res) {
    try {
      const post = await BlogPost.getById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
      res.json({ success: true, data: post });
    } catch (error) {
      console.error('Get blog post error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch blog post' });
    }
  },

  async getByCategory(req, res) {
    try {
      const posts = await BlogPost.getByCategory(req.params.category);
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error('Get posts by category error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch posts by category' });
    }
  },

  async getCategories(req, res) {
    try {
      const categories = await BlogPost.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
  },

  async create(req, res) {
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
      let imagePath = null;
      if (req.file) {
        imagePath = '/blog/' + req.file.filename;
      }
      
      let tags = req.body.tags;
      if (tags && typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = [tags];
        }
      }
      
      const postData = {
        title: req.body.title,
        title_fr: req.body.title_fr || null,
        slug: req.body.slug,
        excerpt: req.body.excerpt || null,
        content: req.body.content || null,
        featured_image: req.body.featured_image || null,
        author: req.body.author || null,
        category: req.body.category || null,
        tags: tags || [],
        status: req.body.status || 'draft',
        published_at: req.body.status === 'published' ? new Date() : null
      };
      
      const post = await BlogPost.create(postData, req.admin.id, imagePath);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'CREATE_BLOG_POST',
        entity: 'blog_posts',
        entityId: post.id,
        details: { title: post.title, status: post.status },
        ip: req.ip
      });
      
      res.status(201).json({ success: true, data: post, message: 'Blog post created successfully' });
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }
      console.error('Create blog post error:', error);
      res.status(500).json({ success: false, error: 'Failed to create blog post: ' + error.message });
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
      const existing = await BlogPost.getById(req.params.id);
      if (!existing) {
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error('Failed to delete file:', unlinkError);
          }
        }
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
      
      let imagePath = null;
      if (req.file) {
        imagePath = '/blog/' + req.file.filename;
        if (existing.featured_image && existing.featured_image.includes('/blog/')) {
          const oldPath = path.join(__dirname, '../../uploads', existing.featured_image);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (unlinkError) {
              console.error('Failed to delete old image:', unlinkError);
            }
          }
        }
      }
      
      let tags = req.body.tags;
      if (tags && typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = [tags];
        }
      }
      
      const updateData = {
        title: req.body.title,
        title_fr: req.body.title_fr,
        slug: req.body.slug,
        excerpt: req.body.excerpt,
        content: req.body.content,
        featured_image: req.body.featured_image,
        author: req.body.author,
        category: req.body.category,
        tags: tags,
        status: req.body.status,
        oldStatus: existing.status
      };
      
      const post = await BlogPost.update(req.params.id, updateData, req.admin.id, imagePath);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'UPDATE_BLOG_POST',
        entity: 'blog_posts',
        entityId: post.id,
        details: { title: post.title, status: post.status },
        ip: req.ip
      });
      
      res.json({ success: true, data: post, message: 'Blog post updated successfully' });
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }
      console.error('Update blog post error:', error);
      res.status(500).json({ success: false, error: 'Failed to update blog post: ' + error.message });
    }
  },

  async delete(req, res) {
    try {
      const existing = await BlogPost.getById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
      
      await BlogPost.delete(req.params.id);
      
      await logActivity({
        adminId: req.admin.id,
        action: 'DELETE_BLOG_POST',
        entity: 'blog_posts',
        entityId: req.params.id,
        details: { title: existing.title },
        ip: req.ip
      });
      
      res.json({ success: true, message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error('Delete blog post error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete blog post: ' + error.message });
    }
  }
};

module.exports = blogController;