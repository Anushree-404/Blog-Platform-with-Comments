import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPosts } from '../api/posts';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';

  const [searchInput, setSearchInput] = useState(search);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getPosts({ page, limit: 9, search, tag });
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch {
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, tag]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchInput, page: '1' });
  };

  const handleTagClick = (t) => {
    setSearchParams({ tag: t, page: '1' });
    setSearchInput('');
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchInput('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          Welcome to <span className="text-indigo-600">BlogSpace</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Discover stories, ideas, and perspectives from writers around the world.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-8">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search posts..."
          className="input flex-1"
          aria-label="Search posts"
        />
        <button type="submit" className="btn-primary">Search</button>
        {(search || tag) && (
          <button type="button" onClick={clearFilters} className="btn-secondary">
            Clear
          </button>
        )}
      </form>

      {/* Active filters */}
      {(search || tag) && (
        <div className="flex items-center gap-2 mb-6 justify-center">
          <span className="text-sm text-gray-500">Filtering by:</span>
          {search && <span className="tag">Search: {search}</span>}
          {tag && <span className="tag">Tag: {tag}</span>}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Spinner className="py-20" size="lg" />
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchPosts} className="btn-primary">Retry</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg">No posts found.</p>
          {(search || tag) && (
            <button onClick={clearFilters} className="mt-4 btn-secondary">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onTagClick={handleTagClick} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setSearchParams({ page: String(page - 1), search, tag })}
                disabled={page <= 1}
                className="btn-secondary btn-sm"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600 px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setSearchParams({ page: String(page + 1), search, tag })}
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
  );
}
