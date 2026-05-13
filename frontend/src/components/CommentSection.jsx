import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { createComment, updateComment, deleteComment } from '../api/comments';

function CommentItem({ comment, postId, onCommentAdded, onCommentUpdated, onCommentDeleted, depth = 0 }) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  const isOwner = user?.id === comment.author?.id;

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await createComment(postId, { content: replyContent, parentId: comment.id });
      onCommentAdded(data.comment, comment.id);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await updateComment(comment.id, { content: editContent });
      onCommentUpdated(data.comment);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update comment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(comment.id);
      onCommentDeleted(comment.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="flex gap-3 py-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author?.avatar ? (
            <img src={comment.author.avatar} alt={comment.author.username} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
              {comment.author?.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">{comment.author?.username}</span>
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>

          {isEditing ? (
            <form onSubmit={handleEdit} className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input text-sm resize-none"
                rows={3}
                required
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn-primary btn-sm text-xs">
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary btn-sm text-xs">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2">
              {user && depth === 0 && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  Reply
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
              {user && user.role === 'admin' && !isOwner && (
                <button
                  onClick={handleDelete}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {/* Reply form */}
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="input text-sm resize-none"
                rows={2}
                required
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn-primary btn-sm text-xs">
                  {loading ? 'Posting...' : 'Post Reply'}
                </button>
                <button type="button" onClick={() => setShowReplyForm(false)} className="btn-secondary btn-sm text-xs">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          onCommentAdded={onCommentAdded}
          onCommentUpdated={onCommentUpdated}
          onCommentDeleted={onCommentDeleted}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function CommentSection({ postId, initialComments = [] }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await createComment(postId, { content: newComment });
      setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
      setNewComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newReply, parentId) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
      )
    );
  };

  const handleCommentUpdated = (updated) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === updated.id) return { ...updated, replies: c.replies };
        return {
          ...c,
          replies: c.replies?.map((r) => (r.id === updated.id ? updated : r)) || [],
        };
      })
    );
  };

  const handleCommentDeleted = (deletedId) => {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== deletedId)
        .map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== deletedId) || [],
        }))
    );
  };

  return (
    <section aria-label="Comments">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h2>

      {/* New comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {user.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="input resize-none"
                rows={3}
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary btn-sm">
                {loading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 text-sm">
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
            {' '}to join the conversation.
          </p>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentAdded={handleCommentAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </section>
  );
}
