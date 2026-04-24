const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const teamValidator = require('../validators/teamValidator');
const { authenticate } = require('../../middleware/auth');
const { uploadTeam } = require('../../middleware/upload');

router.get('/', teamController.getAll);
router.get('/active', teamController.getActive);
router.get('/:id', teamController.getById);
router.post('/', authenticate, uploadTeam.single('avatar'), teamValidator.create, teamController.create);
router.put('/:id', authenticate, uploadTeam.single('avatar'), teamValidator.update, teamController.update);
router.delete('/:id', authenticate, teamController.delete);
router.put('/order/reorder', authenticate, teamValidator.updateOrder, teamController.updateOrder);

module.exports = router;