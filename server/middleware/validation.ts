import { body, ValidationChain } from 'express-validator';
import xss from 'xss';

// XSS sanitization options
const xssOptions = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

// Custom sanitizer to remove XSS
const sanitizeXSS = (value: string): string => {
  return xss(value, xssOptions);
};

// Validation rules for blog post submission
export const blogPostValidation: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 0, max: 200 })
    .withMessage('Title must be less than 200 characters')
    .customSanitizer(sanitizeXSS),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10,000 characters')
    .customSanitizer(sanitizeXSS)
    .custom((value) => {
      // Check for common malicious patterns
      const maliciousPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[\s\S]*?>/gi,
        /eval\(/gi,
        /expression\(/gi,
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(value)) {
          throw new Error('Content contains potentially malicious code');
        }
      }
      return true;
    }),

  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters')
    .customSanitizer(sanitizeXSS)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Author name contains invalid characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeXSS),

  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 tags allowed')
    .custom((tags: string[]) => {
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          if (typeof tag !== 'string' || tag.length > 30) {
            throw new Error('Each tag must be a string with max 30 characters');
          }
          if (!/^[a-zA-Z0-9-]+$/.test(tag)) {
            throw new Error('Tags can only contain letters, numbers, and hyphens');
          }
        }
      }
      return true;
    })
    .customSanitizer((tags: string[]) => {
      if (Array.isArray(tags)) {
        return tags.map((tag) => sanitizeXSS(tag));
      }
      return tags;
    }),
];
