const { body } = require('express-validator');

const serviceValidator = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required'),
    body('slug')
      .trim()
      .notEmpty()
      .withMessage('Slug is required')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug can only contain lowercase letters, numbers and hyphens'),
    body('description')
      .optional()
      .trim(),
    body('icon')
      .optional()
      .trim(),
    body('tech_stack')
      .optional()
      .custom((value) => {
        if (!value) return true;
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') return true;
        return false;
      }),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean'),
    body('display_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a positive integer')
  ],

  update: [
    body('title')
      .optional()
      .trim(),
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug can only contain lowercase letters, numbers and hyphens'),
    body('tech_stack')
      .optional()
      .custom((value) => {
        if (!value) return true;
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') return true;
        return false;
      }),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean')
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

module.exports = serviceValidator;