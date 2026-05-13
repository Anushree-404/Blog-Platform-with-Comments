const { Op } = require('sequelize');

/**
 * Converts a title string into a URL-friendly slug.
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generates a unique slug by appending a counter if needed.
 */
const generateUniqueSlug = async (title, PostModel, excludeId = null) => {
  let slug = slugify(title);
  let exists = true;
  let counter = 0;
  let candidateSlug = slug;

  while (exists) {
    const where = { slug: candidateSlug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const post = await PostModel.findOne({ where });
    if (!post) {
      exists = false;
    } else {
      counter++;
      candidateSlug = `${slug}-${counter}`;
    }
  }

  return candidateSlug;
};

module.exports = { slugify, generateUniqueSlug };
