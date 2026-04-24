const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const blogValidator = require('../validators/blogValidator');
const { authenticate } = require('../../middleware/auth');
const { uploadBlog } = require('../../middleware/upload');

router.get('/', blogController.getAll);
router.get('/published', blogController.getPublished);
router.get('/categories', blogController.getCategories);
router.get('/category/:category', blogController.getByCategory);
router.get('/slug/:slug', blogController.getBySlug);
router.get('/:id', blogController.getById);
router.post('/', authenticate, uploadBlog.single('featured_image'), blogValidator.create, blogController.create);
router.put('/:id', authenticate, uploadBlog.single('featured_image'), blogValidator.update, blogController.update);
router.delete('/:id', authenticate, blogController.delete);

module.exports = router;