import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { posts as postsApi, categories as categoriesApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CreatePost = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadCategories();
  }, [isAuthenticated]);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await postsApi.create({
        title,
        content,
        categoryId: categoryId ? parseInt(categoryId) : null,
      });
      navigate(`/post/${response.data.postId}`);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Create a new post</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a category (optional)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an engaging title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              minLength={5}
              maxLength={300}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content * <span className="text-gray-500 font-normal">(Markdown supported)</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, code, or questions with the community..."
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="12"
              required
              minLength={10}
            />
            <p className="mt-2 text-sm text-gray-500">
              You can use Markdown to format your post. Supports headings, lists, code blocks, and more.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Markdown help */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3">Markdown Quick Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Headers:</p>
            <code className="text-xs bg-gray-100 p-1 rounded"># H1, ## H2, ### H3</code>
          </div>
          <div>
            <p className="font-medium mb-1">Bold:</p>
            <code className="text-xs bg-gray-100 p-1 rounded">**bold text**</code>
          </div>
          <div>
            <p className="font-medium mb-1">Italic:</p>
            <code className="text-xs bg-gray-100 p-1 rounded">*italic text*</code>
          </div>
          <div>
            <p className="font-medium mb-1">Link:</p>
            <code className="text-xs bg-gray-100 p-1 rounded">[text](url)</code>
          </div>
          <div>
            <p className="font-medium mb-1">List:</p>
            <code className="text-xs bg-gray-100 p-1 rounded">- item 1</code>
          </div>
          <div>
            <p className="font-medium mb-1">Code:</p>
            <code className="text-xs bg-gray-100 p-1 rounded">`code`</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
