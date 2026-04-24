const { body } = require('express-validator');

const teamValidator = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .trim(),
    body('role')
      .optional()
      .trim(),
    body('department')
      .optional()
      .trim(),
    body('bio')
      .optional()
      .trim(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('linkedin')
      .optional()
      .trim(),
    body('twitter')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['Active', 'Remote', 'On Leave'])
      .withMessage('Status must be Active, Remote, or On Leave'),
    body('display_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a positive number')
  ],

  update: [
    body('name')
      .optional()
      .trim(),
    body('role')
      .optional()
      .trim(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('linkedin')
      .optional()
      .trim(),
    body('twitter')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['Active', 'Remote', 'On Leave'])
      .withMessage('Status must be Active, Remote, or On Leave'),
    body('display_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a positive number')
  ],

  updateOrder: [
    body('orders')
      .isArray()
      .withMessage('Orders must be an array'),
    body('orders.*.id')
      .notEmpty()
      .withMessage('Each order must have an id'),
    body('orders.*.order')
      .isInt({ min: 0 })
      .withMessage('Each order must have a valid order number')
  ]
};

module.exports = teamValidator;