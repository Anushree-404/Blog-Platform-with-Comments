import React, { useState } from 'react';

// Google domains that block hotlinking
const BLOCKED_DOMAINS = [
  'google.com', 'gstatic.com', 'googleusercontent.com',
  'bing.com', 'yahoo.com',
];

const isBlockedImageUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    return BLOCKED_DOMAINS.some((d) => hostname.includes(d));
  } catch {
    return false;
  }
};

export default function PostEditor({ initialData = {}, onSubmit, loading, submitLabel = 'Publish Post' }) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    content: initialData.content || '',
    excerpt: initialData.excerpt || '',
    coverImage: initialData.coverImage || '',
    status: initialData.status || 'published',
    tags: initialData.tags?.join(', ') || '',
  });
  const [errors, setErrors] = useState({});
  const [imgLoadError, setImgLoadError] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.title.trim() || form.title.length < 3) errs.title = 'Title must be at least 3 characters.';
    if (!form.content.trim()) errs.content = 'Content is required.';
    if (form.coverImage) {
      if (!/^https?:\/\/.+/.test(form.coverImage)) {
        errs.coverImage = 'Cover image must be a valid URL starting with https://';
      } else if (isBlockedImageUrl(form.coverImage)) {
        errs.coverImage = 'Google/Bing image URLs cannot be embedded. Please use a direct image URL (see tip below).';
      }
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'coverImage') setImgLoadError(false);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    onSubmit({ ...form, tags });
  };

  const showPreview = form.coverImage && !errors.coverImage && !isBlockedImageUrl(form.coverImage);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          placeholder="Enter a compelling title..."
          className={`input text-lg font-medium ${errors.title ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>

      {/* Cover Image */}
      <div>
        <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">
          Cover Image URL
        </label>

        {/* Tip box */}
        <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 space-y-1">
          <p className="font-semibold">💡 How to get a working image URL:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Go to <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">unsplash.com</a> or <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">pixabay.com</a></li>
            <li>Find an image → right-click it → <strong>Copy image address</strong></li>
            <li>Paste that URL here</li>
          </ol>
          <p className="text-red-600 font-medium">✗ Google Images URLs will NOT work (they block embedding)</p>
        </div>

        <input
          id="coverImage"
          name="coverImage"
          type="url"
          value={form.coverImage}
          onChange={handleChange}
          placeholder="https://images.unsplash.com/photo-..."
          className={`input ${errors.coverImage ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        {errors.coverImage && (
          <p className="mt-1 text-sm text-red-500">{errors.coverImage}</p>
        )}

        {/* Live preview */}
        {showPreview && (
          <div className="mt-2">
            {imgLoadError ? (
              <div className="h-32 w-full rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400">
                ⚠️ Image failed to load — check the URL
              </div>
            ) : (
              <img
                src={form.coverImage}
                alt="Cover preview"
                className="h-32 w-full object-cover rounded-lg border border-gray-200"
                referrerPolicy="no-referrer"
                onError={() => setImgLoadError(true)}
              />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Supports Markdown: **bold**, *italic*, # Heading, - list, `code`, &gt; blockquote
        </p>
        <textarea
          id="content"
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Write your post content here..."
          rows={16}
          className={`input font-mono text-sm resize-y ${errors.content ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
          Excerpt <span className="text-gray-400 font-normal">(optional — auto-generated if empty)</span>
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          value={form.excerpt}
          onChange={handleChange}
          placeholder="A short summary of your post..."
          rows={2}
          maxLength={500}
          className="input resize-none"
        />
        <p className="mt-1 text-xs text-gray-400">{form.excerpt.length}/500</p>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          value={form.tags}
          onChange={handleChange}
          placeholder="technology, programming, web"
          className="input"
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select id="status" name="status" value={form.status} onChange={handleChange} className="input">
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={() => window.history.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
