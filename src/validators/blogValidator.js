const { body } = require('express-validator');

const blogValidator = {
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
    body('excerpt')
      .optional()
      .trim(),
    body('content')
      .optional()
      .trim(),
    body('category')
      .optional()
      .trim(),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'scheduled', 'archived'])
      .withMessage('Status must be draft, published, scheduled or archived'),
    body('published_at')
      .optional()
      .isISO8601()
      .withMessage('Published at must be a valid date')
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
    body('status')
      .optional()
      .isIn(['draft', 'published', 'scheduled', 'archived'])
      .withMessage('Status must be draft, published, scheduled or archived')
  ]
};

module.exports = blogValidator;