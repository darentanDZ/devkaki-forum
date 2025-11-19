const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:username', (req, res) => {
  const { username } = req.params;

  const query = `
    SELECT id, username, display_name, bio, avatar_url, karma, created_at,
    (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count,
    (SELECT COUNT(*) FROM comments WHERE user_id = users.id) as comment_count
    FROM users
    WHERE username = ?
  `;

  db.get(query, [username], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      karma: user.karma,
      postCount: user.post_count,
      commentCount: user.comment_count,
      createdAt: user.created_at
    });
  });
});

// Get user's posts
router.get('/:username/posts', (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [user.id, limit, offset], (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch posts' });
      }

      db.get('SELECT COUNT(*) as total FROM posts WHERE user_id = ?', [user.id], (err, count) => {
        res.json({
          posts: posts.map(p => ({
            id: p.id,
            title: p.title,
            content: p.content,
            upvotes: p.upvotes,
            downvotes: p.downvotes,
            viewCount: p.view_count,
            commentCount: p.comment_count,
            createdAt: p.created_at,
            category: p.category_id ? {
              name: p.category_name,
              slug: p.category_slug,
              color: p.category_color
            } : null
          })),
          total: count?.total || 0,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      });
    });
  });
});

// Get user's comments
router.get('/:username/comments', (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const query = `
      SELECT c.*, p.id as post_id, p.title as post_title
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [user.id, limit, offset], (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch comments' });
      }

      db.get('SELECT COUNT(*) as total FROM comments WHERE user_id = ?', [user.id], (err, count) => {
        res.json({
          comments: comments.map(c => ({
            id: c.id,
            content: c.content,
            upvotes: c.upvotes,
            downvotes: c.downvotes,
            createdAt: c.created_at,
            post: {
              id: c.post_id,
              title: c.post_title
            }
          })),
          total: count?.total || 0,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      });
    });
  });
});

// Update user profile
router.put('/profile', authMiddleware, [
  body('displayName').optional().trim().isLength({ max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('avatarUrl').optional().trim().isURL()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { displayName, bio, avatarUrl } = req.body;

  const updates = [];
  const params = [];

  if (displayName !== undefined) {
    updates.push('display_name = ?');
    params.push(displayName);
  }
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (avatarUrl !== undefined) {
    updates.push('avatar_url = ?');
    params.push(avatarUrl);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.user.id);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params,
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

module.exports = router;
