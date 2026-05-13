import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { getMyPosts, deletePost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyPosts({ page, limit: 10 });
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;
  const totalViews = posts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your posts and content</p>
        </div>
        <Link to="/posts/new" className="btn-primary">
          + New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: pagination?.total ?? posts.length, icon: '📝' },
          { label: 'Published', value: publishedCount, icon: '✅' },
          { label: 'Drafts', value: draftCount, icon: '📋' },
          { label: 'Total Views', value: totalViews, icon: '👁️' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Posts table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Your Posts</h2>
        </div>

        {loading ? (
          <Spinner className="py-16" />
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">You haven't written any posts yet.</p>
            <Link to="/posts/new" className="btn-primary">Write your first post</Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <div key={post.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {post.status}
                      </span>
                      {post.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="tag text-xs">{tag}</span>
                      ))}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{post.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                      <span>👁 {post.viewCount || 0}</span>
                      <span>💬 {post.comments?.length || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.status === 'published' && (
                      <Link
                        to={`/posts/${post.slug}`}
                        className="btn-secondary btn-sm text-xs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </Link>
                    )}
                    <Link to={`/posts/${post.id}/edit`} className="btn-secondary btn-sm text-xs">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="btn-danger btn-sm text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="btn-secondary btn-sm"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                  className="btn-secondary btn-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
