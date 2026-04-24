const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const serviceValidator = require('../validators/serviceValidator');
const { authenticate } = require('../../middleware/auth');
const { uploadService } = require('../../middleware/upload');

router.get('/', serviceController.getAll);
router.get('/featured', serviceController.getFeatured);
router.get('/slug/:slug', serviceController.getBySlug);
router.get('/:id', serviceController.getById);
router.post('/', authenticate, uploadService.single('image'), serviceValidator.create, serviceController.create);
router.put('/:id', authenticate, uploadService.single('image'), serviceValidator.update, serviceController.update);
router.delete('/:id', authenticate, serviceController.delete);
router.put('/order/reorder', authenticate, serviceValidator.updateOrder, serviceController.updateOrder);

module.exports = router;