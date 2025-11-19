import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Reply, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const Comment = ({ comment, onVote, onReply, onEdit, onDelete, userVotes, depth = 0 }) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);

  const score = comment.upvotes - comment.downvotes;
  const userVote = userVotes?.[comment.id] || 0;
  const isAuthor = user?.id === comment.author.id;
  const maxDepth = 5;

  const handleReply = async () => {
    if (replyContent.trim()) {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== comment.content) {
      await onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-2 border-l-2 border-gray-200 pl-4' : 'mb-4'}`}>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {comment.author.displayName[0].toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Link to={`/user/${comment.author.username}`} className="font-medium text-gray-900 hover:text-primary-600">
                {comment.author.displayName}
              </Link>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>

            {isEditing ? (
              <div className="mb-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="3"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            )}

            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onVote && onVote(comment.id, userVote === 1 ? 0 : 1)}
                  className={`p-1 rounded ${userVote === 1 ? 'text-primary-600 bg-primary-100' : 'text-gray-400 hover:text-primary-600'}`}
                >
                  <ArrowUp size={16} />
                </button>
                <span className={`text-sm font-medium ${score > 0 ? 'text-primary-600' : score < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {score}
                </span>
                <button
                  onClick={() => onVote && onVote(comment.id, userVote === -1 ? 0 : -1)}
                  className={`p-1 rounded ${userVote === -1 ? 'text-red-600 bg-red-100' : 'text-gray-400 hover:text-red-600'}`}
                >
                  <ArrowDown size={16} />
                </button>
              </div>

              {depth < maxDepth && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center text-sm text-gray-600 hover:text-primary-600"
                >
                  <Reply size={14} className="mr-1" />
                  Reply
                </button>
              )}

              {isAuthor && !isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center text-sm text-gray-600 hover:text-primary-600"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="flex items-center text-sm text-gray-600 hover:text-red-600"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </button>
                </>
              )}
            </div>

            {isReplying && (
              <div className="mt-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="3"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleReply}
                    className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {showReplies ? (
            <>
              {comment.replies.map((reply) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  onVote={onVote}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  userVotes={userVotes}
                  depth={depth + 1}
                />
              ))}
            </>
          ) : (
            <button
              onClick={() => setShowReplies(true)}
              className="text-sm text-primary-600 hover:text-primary-700 ml-4"
            >
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Comment;
