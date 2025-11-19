import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { posts as postsApi, comments as commentsApi, votes as votesApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Comment from '../components/Comment';
import { ArrowUp, ArrowDown, MessageCircle, Eye, Edit, Trash2, Lock, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    loadPost();
    loadComments();
    if (isAuthenticated) {
      loadUserVotes();
    }
  }, [id, isAuthenticated]);

  const loadPost = async () => {
    try {
      const response = await postsApi.getOne(id);
      setPost(response.data);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentsApi.getByPost(id);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadUserVotes = async () => {
    try {
      const response = await votesApi.getUserVotes(id);
      setUserVotes(response.data);
    } catch (error) {
      console.error('Failed to load votes:', error);
    }
  };

  const handleVotePost = async (voteType) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    try {
      await votesApi.votePost(id, voteType);
      loadPost();
      loadUserVotes();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleVoteComment = async (commentId, voteType) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    try {
      await votesApi.voteComment(commentId, voteType);
      loadComments();
      loadUserVotes();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to comment');
      return;
    }

    try {
      await commentsApi.create({
        content: commentContent,
        postId: parseInt(id),
      });
      setCommentContent('');
      loadComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleReply = async (parentId, content) => {
    try {
      await commentsApi.create({
        content,
        postId: parseInt(id),
        parentId,
      });
      loadComments();
    } catch (error) {
      console.error('Failed to post reply:', error);
    }
  };

  const handleEditComment = async (commentId, content) => {
    try {
      await commentsApi.update(commentId, { content });
      loadComments();
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentsApi.delete(commentId);
        loadComments();
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsApi.delete(id);
        navigate('/');
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  const score = post.upvotes - post.downvotes;
  const isAuthor = user?.id === post.author.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Post */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex">
          {/* Vote section */}
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-l-lg">
            <button
              onClick={() => handleVotePost(userVotes.post === 1 ? 0 : 1)}
              className={`p-2 rounded ${
                userVotes.post === 1
                  ? 'text-primary-600 bg-primary-100'
                  : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100'
              }`}
            >
              <ArrowUp size={24} />
            </button>
            <span className={`font-bold text-xl my-2 ${score > 0 ? 'text-primary-600' : score < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {score}
            </span>
            <button
              onClick={() => handleVotePost(userVotes.post === -1 ? 0 : -1)}
              className={`p-2 rounded ${
                userVotes.post === -1
                  ? 'text-red-600 bg-red-100'
                  : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
              }`}
            >
              <ArrowDown size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {post.isPinned && (
              <div className="flex items-center text-green-600 text-sm mb-2">
                <Pin size={16} className="mr-1" />
                <span>Pinned by moderator</span>
              </div>
            )}
            {post.isLocked && (
              <div className="flex items-center text-yellow-600 text-sm mb-2">
                <Lock size={16} className="mr-1" />
                <span>This post is locked</span>
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

            <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mb-4">
              {post.category && (
                <Link
                  to={`/?category=${post.category.slug}`}
                  className="px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}
                >
                  {post.category.name}
                </Link>
              )}
              <span>Posted by</span>
              <Link to={`/user/${post.author.username}`} className="font-medium hover:text-primary-600">
                {post.author.displayName}
              </Link>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>

            <div className="prose max-w-none mb-4">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
              <div className="flex items-center">
                <MessageCircle size={16} className="mr-1" />
                <span>{post.commentCount} comments</span>
              </div>
              <div className="flex items-center">
                <Eye size={16} className="mr-1" />
                <span>{post.viewCount} views</span>
              </div>
              {(isAuthor || isAdmin) && (
                <>
                  {isAuthor && (
                    <Link to={`/edit/${post.id}`} className="flex items-center text-primary-600 hover:text-primary-700">
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Link>
                  )}
                  <button onClick={handleDeletePost} className="flex items-center text-red-600 hover:text-red-700">
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment form */}
      {isAuthenticated && !post.isLocked ? (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Add a comment</h3>
          <form onSubmit={handleComment}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="What are your thoughts?"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="4"
              required
            />
            <button
              type="submit"
              className="mt-3 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Comment
            </button>
          </form>
        </div>
      ) : !isAuthenticated ? (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
          <p className="text-gray-600">
            <Link to="/login" className="text-primary-600 hover:text-primary-700">Login</Link> to comment
          </p>
        </div>
      ) : null}

      {/* Comments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">
          Comments ({post.commentCount})
        </h3>
        {comments.length > 0 ? (
          <div>
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onVote={handleVoteComment}
                onReply={handleReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                userVotes={userVotes.comments}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
