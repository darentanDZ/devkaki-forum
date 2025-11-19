const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require admin access
router.use(authMiddleware);
router.use(adminMiddleware);

// Get dashboard statistics
router.get('/stats', (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
    stats.totalUsers = result?.count || 0;

    db.get('SELECT COUNT(*) as count FROM posts', [], (err, result) => {
      stats.totalPosts = result?.count || 0;

      db.get('SELECT COUNT(*) as count FROM comments', [], (err, result) => {
        stats.totalComments = result?.count || 0;

        db.get('SELECT COUNT(*) as count FROM categories', [], (err, result) => {
          stats.totalCategories = result?.count || 0;

          // Get recent activity
          const query = `
            SELECT 'post' as type, p.id, p.title as content, p.created_at, u.username
            FROM posts p
            JOIN users u ON p.user_id = u.id
            UNION ALL
            SELECT 'comment' as type, c.id, c.content, c.created_at, u.username
            FROM comments c
            JOIN users u ON c.user_id = u.id
            ORDER BY created_at DESC
            LIMIT 10
          `;

          db.all(query, [], (err, activity) => {
            stats.recentActivity = activity || [];
            res.json(stats);
          });
        });
      });
    });
  });
});

// Get all users with pagination
router.get('/users', (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT u.id, u.username, u.email, u.display_name, u.role, u.karma, u.created_at,
    (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
    (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comment_count
    FROM users u
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (u.username LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(query, params, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (username LIKE ? OR email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    db.get(countQuery, countParams, (err, count) => {
      res.json({
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          displayName: u.display_name,
          role: u.role,
          karma: u.karma,
          postCount: u.post_count,
          commentCount: u.comment_count,
          createdAt: u.created_at
        })),
        total: count?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// Update user role
router.patch('/users/:id/role', [
  body('role').isIn(['user', 'admin', 'moderator'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { role } = req.body;

  db.run('UPDATE users SET role = ? WHERE id = ?', [role, id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user role' });
    }
    res.json({ message: 'User role updated successfully' });
  });
});

// Delete user
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  // Don't allow deleting yourself
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Get all posts for moderation
router.get('/posts', (req, res) => {
  const { page = 1, limit = 50, flagged } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT p.*, u.username, c.name as category_name,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    db.get('SELECT COUNT(*) as total FROM posts', [], (err, count) => {
      res.json({
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content,
          author: p.username,
          category: p.category_name,
          commentCount: p.comment_count,
          upvotes: p.upvotes,
          downvotes: p.downvotes,
          isPinned: p.is_pinned,
          isLocked: p.is_locked,
          createdAt: p.created_at
        })),
        total: count?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// Get all comments for moderation
router.get('/comments', (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT c.*, u.username, p.title as post_title, p.id as post_id
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN posts p ON c.post_id = p.id
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [limit, offset], (err, comments) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }

    db.get('SELECT COUNT(*) as total FROM comments', [], (err, count) => {
      res.json({
        comments: comments.map(c => ({
          id: c.id,
          content: c.content,
          author: c.username,
          postId: c.post_id,
          postTitle: c.post_title,
          upvotes: c.upvotes,
          downvotes: c.downvotes,
          createdAt: c.created_at
        })),
        total: count?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

module.exports = router;
