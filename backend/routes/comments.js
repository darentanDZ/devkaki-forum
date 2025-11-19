const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', (req, res) => {
  const { postId } = req.params;

  const query = `
    SELECT c.*, u.username, u.display_name, u.avatar_url, u.karma,
    (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as reply_count
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `;

  db.all(query, [postId], (err, comments) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }

    // Build nested comment structure
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
      commentMap[comment.id] = {
        id: comment.id,
        content: comment.content,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          id: comment.user_id,
          username: comment.username,
          displayName: comment.display_name,
          avatarUrl: comment.avatar_url,
          karma: comment.karma
        },
        replyCount: comment.reply_count,
        replies: []
      };
    });

    comments.forEach(comment => {
      if (comment.parent_id) {
        if (commentMap[comment.parent_id]) {
          commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
        }
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    res.json(rootComments);
  });
});

// Create comment
router.post('/', authMiddleware, [
  body('content').trim().isLength({ min: 1, max: 10000 }),
  body('postId').isInt(),
  body('parentId').optional().isInt()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content, postId, parentId } = req.body;

  // Check if post exists and is not locked
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.is_locked && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Post is locked' });
    }

    db.run(
      'INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)',
      [content, req.user.id, postId, parentId || null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create comment' });
        }

        res.status(201).json({
          message: 'Comment created successfully',
          commentId: this.lastID
        });
      }
    );
  });
});

// Update comment
router.put('/:id', authMiddleware, [
  body('content').trim().isLength({ min: 1, max: 10000 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { content } = req.body;

  db.get('SELECT * FROM comments WHERE id = ?', [id], (err, comment) => {
    if (err || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run(
      'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update comment' });
        }
        res.json({ message: 'Comment updated successfully' });
      }
    );
  });
});

// Delete comment
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM comments WHERE id = ?', [id], (err, comment) => {
    if (err || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run('DELETE FROM comments WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete comment' });
      }
      res.json({ message: 'Comment deleted successfully' });
    });
  });
});

module.exports = router;
