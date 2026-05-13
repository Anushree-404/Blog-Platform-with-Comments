import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyPosts, updatePost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import PostEditor from '../components/PostEditor';
import Spinner from '../components/Spinner';

export default function EditPostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await getMyPosts({ limit: 100 });
        const found = data.posts.find((p) => p.id === parseInt(id));
        if (!found) {
          setError('Post not found or you do not have permission to edit it.');
        } else {
          setPost(found);
        }
      } catch {
        setError('Failed to load post.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    setError('');
    try {
      const { data } = await updatePost(id, formData);
      navigate(`/posts/${data.post.slug}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post.');
      setSaving(false);
    }
  };

  if (loading) return <Spinner className="py-32" size="lg" />;

  if (error && !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
        <p className="text-gray-500 mt-1">Update your story</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      <div className="card p-6 sm:p-8">
        <PostEditor
          initialData={post}
          onSubmit={handleSubmit}
          loading={saving}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
