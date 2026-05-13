const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getMyPosts,
} = require('../controllers/postController');
const { authenticate } = require('../middleware/auth');

// GET /api/posts — public
router.get('/', getPosts);

// GET /api/posts/my/posts — auth required (must be before /:slug)
router.get('/my/posts', authenticate, getMyPosts);

// GET /api/posts/:slug — public
router.get('/:slug', getPostBySlug);

// POST /api/posts — auth required
router.post(
  '/',
  authenticate,
  [
    body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3–255 characters.'),
    body('content').trim().notEmpty().withMessage('Content is required.'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published.'),
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
  ],
  createPost
);

// PUT /api/posts/:id — auth required
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3–255 characters.'),
    body('content').optional().trim().notEmpty().withMessage('Content cannot be empty.'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published.'),
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
  ],
  updatePost
);

// DELETE /api/posts/:id — auth required
router.delete('/:id', authenticate, deletePost);

module.exports = router;
