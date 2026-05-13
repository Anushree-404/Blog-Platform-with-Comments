import api from './axios';

export const getPosts = (params) => api.get('/posts', { params });
export const getPostBySlug = (slug) => api.get(`/posts/${slug}`);
export const createPost = (data) => api.post('/posts', data);
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const getMyPosts = (params) => api.get('/posts/my/posts', { params });
