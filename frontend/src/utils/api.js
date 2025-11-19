import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Posts
export const posts = {
  getAll: (params) => api.get('/posts', { params }),
  getOne: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  pin: (id, isPinned) => api.patch(`/posts/${id}/pin`, { isPinned }),
  lock: (id, isLocked) => api.patch(`/posts/${id}/lock`, { isLocked }),
};

// Comments
export const comments = {
  getByPost: (postId) => api.get(`/comments/post/${postId}`),
  create: (data) => api.post('/comments', data),
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Votes
export const votes = {
  votePost: (id, voteType) => api.post(`/votes/post/${id}`, { voteType }),
  voteComment: (id, voteType) => api.post(`/votes/comment/${id}`, { voteType }),
  getUserVotes: (postId) => api.get(`/votes/user/post/${postId}`),
};

// Categories
export const categories = {
  getAll: () => api.get('/categories'),
  getOne: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Users
export const users = {
  getProfile: (username) => api.get(`/users/${username}`),
  getPosts: (username, params) => api.get(`/users/${username}/posts`, { params }),
  getComments: (username, params) => api.get(`/users/${username}/comments`, { params }),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Admin
export const admin = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPosts: (params) => api.get('/admin/posts', { params }),
  getComments: (params) => api.get('/admin/comments', { params }),
};

export default api;
