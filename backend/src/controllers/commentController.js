const { validationResult } = require('express-validator');
const { Comment, User, Post } = require('../models');

/**
 * GET /api/posts/:postId/comments
 * Public — get all top-level comments with replies for a post
 */
const getComments = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const comments = await Comment.findAll({
      where: { postId: req.params.postId, parentId: null },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
        {
          model: Comment,
          as: 'replies',
          include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
          order: [['createdAt', 'ASC']],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posts/:postId/comments
 * Auth required
 */
const createComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const post = await Post.findByPk(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const { content, parentId } = req.body;

    // Validate parent comment if replying
    if (parentId) {
      const parent = await Comment.findByPk(parentId);
      if (!parent || parent.postId !== parseInt(req.params.postId)) {
        return res.status(400).json({ message: 'Invalid parent comment.' });
      }
    }

    const comment = await Comment.create({
      content,
      postId: parseInt(req.params.postId),
      authorId: req.user.id,
      parentId: parentId || null,
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
    });

    res.status(201).json({ message: 'Comment added.', comment: fullComment });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/comments/:id
 * Auth required — only comment author
 */
const updateComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this comment.' });
    }

    await comment.update({ content: req.body.content });

    const updatedComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
    });

    res.json({ message: 'Comment updated.', comment: updatedComment });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/comments/:id
 * Auth required — only comment author or admin
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment.' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment };
