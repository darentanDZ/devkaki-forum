import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { users as usersApi } from '../utils/api';
import { User, FileText, MessageCircle, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const UserDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const profileRes = await usersApi.getProfile(user.username);
      setProfile(profileRes.data);
      setFormData({
        displayName: profileRes.data.displayName || '',
        bio: profileRes.data.bio || '',
        avatarUrl: profileRes.data.avatarUrl || '',
      });

      const postsRes = await usersApi.getPosts(user.username);
      setPosts(postsRes.data.posts);

      const commentsRes = await usersApi.getComments(user.username);
      setComments(commentsRes.data.comments);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await usersApi.updateProfile(formData);
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'posts', label: 'My Posts', icon: FileText },
    { id: 'comments', label: 'My Comments', icon: MessageCircle },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl text-primary-600 font-bold">
              {profile.displayName[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-gray-600">@{profile.username}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Award size={16} className="mr-1" />
                <span>{profile.karma} karma</span>
              </div>
              <span>•</span>
              <span>Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      maxLength={50}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="4"
                      maxLength={500}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar URL (optional)
                    </label>
                    <input
                      type="url"
                      value={formData.avatarUrl}
                      onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Bio</h3>
                    <p className="text-gray-900">
                      {profile.bio || 'No bio yet. Click Edit Profile to add one.'}
                    </p>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Stats</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-primary-600">{profile.postCount}</p>
                        <p className="text-sm text-gray-600">Posts</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-primary-600">{profile.commentCount}</p>
                        <p className="text-sm text-gray-600">Comments</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-primary-600">{profile.karma}</p>
                        <p className="text-sm text-gray-600">Karma</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">My Posts ({posts.length})</h2>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <Link to={`/post/${post.id}`} className="block">
                        <h3 className="font-semibold text-gray-900 hover:text-primary-600 mb-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{post.upvotes - post.downvotes} points</span>
                          <span>•</span>
                          <span>{post.commentCount} comments</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  You haven't created any posts yet.{' '}
                  <Link to="/create" className="text-primary-600 hover:text-primary-700">
                    Create your first post
                  </Link>
                </p>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">My Comments ({comments.length})</h2>
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <p className="text-gray-700 mb-2">{comment.content.substring(0, 200)}...</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>on</span>
                        <Link
                          to={`/post/${comment.post.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {comment.post.title}
                        </Link>
                        <span>•</span>
                        <span>{comment.upvotes - comment.downvotes} points</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">You haven't made any comments yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
