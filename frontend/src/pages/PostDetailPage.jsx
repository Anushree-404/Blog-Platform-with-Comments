import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { getPostBySlug, deletePost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import Spinner from '../components/Spinner';

/**
 * Very simple Markdown-to-HTML renderer (no external deps).
 * Handles: headings, bold, italic, code blocks, inline code, blockquotes, lists, links, images, hr.
 */
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Code blocks
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Images (before links)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines
    .replace(/\n/g, '<br />');

  return `<p>${html}</p>`;
}

export default function PostDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [coverImgError, setCoverImgError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data } = await getPostBySlug(slug);
        setPost(data.post);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Post not found.' : 'Failed to load post.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
      setDeleting(false);
    }
  };

  if (loading) return <Spinner className="py-32" size="lg" />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">{error}</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.authorId;
  const canEdit = isAuthor || user?.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Cover image */}
      {post.coverImage && !coverImgError && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-8 shadow-sm"
          referrerPolicy="no-referrer"
          onError={() => setCoverImgError(true)}
        />
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <Link key={tag} to={`/?tag=${tag}`} className="tag hover:bg-indigo-200 transition-colors">
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt={post.author.username} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              {post.author?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 text-sm">{post.author?.username}</p>
            <p className="text-xs text-gray-400">
              {format(new Date(post.createdAt), 'MMM d, yyyy')} ·{' '}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.viewCount} views
          </span>

          {canEdit && (
            <div className="flex gap-2 ml-2">
              <Link to={`/posts/${post.id}/edit`} className="btn-secondary btn-sm text-xs">
                Edit
              </Link>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger btn-sm text-xs">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="prose-content text-gray-800 mb-12"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />

      {/* Author bio */}
      {post.author?.bio && (
        <div className="bg-gray-50 rounded-xl p-6 mb-12 flex gap-4 items-start">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={post.author.username} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {post.author.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 mb-1">About {post.author.username}</p>
            <p className="text-sm text-gray-600">{post.author.bio}</p>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="border-t border-gray-200 pt-10">
        <CommentSection postId={post.id} initialComments={post.comments || []} />
      </div>
    </div>
  );
}
