const express = require('express');
const { body } = require('express-validator');
const router = express.Router({ mergeParams: true });
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// GET /api/posts/:postId/comments — public
router.get('/', getComments);

// POST /api/posts/:postId/comments — auth required
router.post(
  '/',
  authenticate,
  [body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1–2000 characters.')],
  createComment
);

// PUT /api/comments/:id — auth required (mounted separately)
router.put(
  '/:id',
  authenticate,
  [body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1–2000 characters.')],
  updateComment
);

// DELETE /api/comments/:id — auth required (mounted separately)
router.delete('/:id', authenticate, deleteComment);

module.exports = router;
