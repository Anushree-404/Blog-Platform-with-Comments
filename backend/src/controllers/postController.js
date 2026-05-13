const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Post, User, Comment } = require('../models');
const { generateUniqueSlug } = require('../utils/slugify');

/**
 * GET /api/posts
 * Public — list published posts with pagination, search, tag filter
 */
const getPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      tag = '',
      author = '',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: 'published' };

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
      ];
    }

    const authorWhere = {};
    if (author) {
      authorWhere.username = { [Op.like]: `%${author}%` };
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar'],
          where: Object.keys(authorWhere).length ? authorWhere : undefined,
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    // Filter by tag in JS (SQLite doesn't support array operators)
    let posts = rows;
    if (tag) {
      posts = rows.filter((p) => p.tags && p.tags.includes(tag));
    }

    res.json({
      posts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/:slug
 * Public — get single post by slug
 */
const getPostBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { slug: req.params.slug, status: 'published' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar', 'bio'],
        },
        {
          model: Comment,
          as: 'comments',
          where: { parentId: null },
          required: false,
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'avatar'],
            },
            {
              model: Comment,
              as: 'replies',
              include: [
                {
                  model: User,
                  as: 'author',
                  attributes: ['id', 'username', 'avatar'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Increment view count
    await post.increment('viewCount');

    res.json({ post });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posts
 * Auth required
 */
const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { title, content, excerpt, coverImage, status, tags } = req.body;

    const slug = await generateUniqueSlug(title, Post);

    const post = await Post.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200),
      coverImage,
      status: status || 'published',
      tags: tags || [],
      authorId: req.user.id,
    });

    const fullPost = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
    });

    res.status(201).json({ message: 'Post created.', post: fullPost });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/posts/:id
 * Auth required — only author or admin
 */
const updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this post.' });
    }

    const { title, content, excerpt, coverImage, status, tags } = req.body;

    let slug = post.slug;
    if (title && title !== post.title) {
      slug = await generateUniqueSlug(title, Post, post.id);
    }

    await post.update({
      title: title || post.title,
      slug,
      content: content || post.content,
      excerpt: excerpt || (content ? content.substring(0, 200) : post.excerpt),
      coverImage: coverImage !== undefined ? coverImage : post.coverImage,
      status: status || post.status,
      tags: tags !== undefined ? tags : post.tags,
    });

    const updatedPost = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }],
    });

    res.json({ message: 'Post updated.', post: updatedPost });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/posts/:id
 * Auth required — only author or admin
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post.' });
    }

    await post.destroy();
    res.json({ message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/my/posts
 * Auth required — get current user's posts (all statuses)
 */
const getMyPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Post.findAndCountAll({
      where: { authorId: req.user.id },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
        { model: Comment, as: 'comments', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      posts: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPosts, getPostBySlug, createPost, updatePost, deletePost, getMyPosts };
