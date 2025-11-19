import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, MessageCircle, Eye, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PostCard = ({ post, onVote, userVote }) => {
  const score = post.upvotes - post.downvotes;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      <div className="flex">
        {/* Vote section */}
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-l-lg">
          <button
            onClick={() => onVote && onVote(post.id, userVote === 1 ? 0 : 1)}
            className={`p-1 rounded ${
              userVote === 1
                ? 'text-primary-600 bg-primary-100'
                : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100'
            }`}
          >
            <ArrowUp size={20} />
          </button>
          <span className={`font-bold my-1 ${score > 0 ? 'text-primary-600' : score < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {score}
          </span>
          <button
            onClick={() => onVote && onVote(post.id, userVote === -1 ? 0 : -1)}
            className={`p-1 rounded ${
              userVote === -1
                ? 'text-red-600 bg-red-100'
                : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
            }`}
          >
            <ArrowDown size={20} />
          </button>
        </div>

        {/* Content section */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {post.isPinned && (
                <div className="flex items-center text-green-600 text-sm mb-1">
                  <Pin size={14} className="mr-1" />
                  <span>Pinned</span>
                </div>
              )}
              <Link to={`/post/${post.id}`} className="block">
                <h2 className="text-xl font-semibold text-gray-900 hover:text-primary-600 mb-2">
                  {post.title}
                </h2>
              </Link>
              <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mb-2">
                {post.category && (
                  <Link
                    to={`/?category=${post.category.slug}`}
                    className="px-2 py-1 rounded-full text-xs font-medium"
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
              <p className="text-gray-700 line-clamp-3">{post.content.substring(0, 200)}...</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center">
                  <MessageCircle size={16} className="mr-1" />
                  <span>{post.commentCount} comments</span>
                </div>
                <div className="flex items-center">
                  <Eye size={16} className="mr-1" />
                  <span>{post.viewCount} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
