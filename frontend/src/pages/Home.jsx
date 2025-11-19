import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { posts as postsApi, votes as votesApi, categories as categoriesApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Search, TrendingUp, Clock, Trophy } from 'lucide-react';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [userVotes, setUserVotes] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const sort = searchParams.get('sort') || 'hot';
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, [sort, category, search, page]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await postsApi.getAll({ sort, category, search, page, limit: 20 });
      setPosts(response.data.posts);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleVote = async (postId, voteType) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    try {
      await votesApi.votePost(postId, voteType);
      setUserVotes({ ...userVotes, [postId]: voteType });
      loadPosts();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchQuery = formData.get('search');
    if (searchQuery) {
      setSearchParams({ ...Object.fromEntries(searchParams), search: searchQuery });
    } else {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  };

  const sortOptions = [
    { value: 'hot', label: 'Hot', icon: TrendingUp },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: Trophy },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1">
          {/* Search and filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="search"
                  placeholder="Search posts..."
                  defaultValue={search || ''}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Search
              </button>
            </form>

            <div className="flex gap-2">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), sort: option.value })}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                      sort === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={16} className="mr-1" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posts list */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onVote={handleVote}
                  userVote={userVotes[post.id]}
                />
              ))}

              {/* Pagination */}
              {total > 20 && (
                <div className="flex justify-center gap-2 mt-6">
                  {page > 1 && (
                    <button
                      onClick={() => setPage(page - 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                  <span className="px-4 py-2 bg-white border border-gray-300 rounded-md">
                    Page {page} of {Math.ceil(total / 20)}
                  </span>
                  {page < Math.ceil(total / 20) && (
                    <button
                      onClick={() => setPage(page + 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">No posts found</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80">
          {/* Create post button */}
          {isAuthenticated && (
            <Link
              to="/create"
              className="block w-full mb-4 px-4 py-2 bg-primary-600 text-white text-center rounded-md hover:bg-primary-700 font-medium"
            >
              Create Post
            </Link>
          )}

          {/* Categories */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  searchParams.delete('category');
                  setSearchParams(searchParams);
                }}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  !category ? 'bg-primary-50 text-primary-600 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), category: cat.slug })}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                    category === cat.slug ? 'bg-primary-50 text-primary-600 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    {cat.name}
                  </span>
                  <span className="text-sm text-gray-500">{cat.postCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <h3 className="font-semibold text-gray-900 mb-2">About Developer Kaki</h3>
            <p className="text-sm text-gray-600">
              A community-driven forum for developers to share knowledge, ask questions, and connect with fellow developers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
