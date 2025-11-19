const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all posts with pagination and filtering
router.get('/', (req, res) => {
  const { category, sort = 'hot', page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, u.username, u.display_name, u.avatar_url, c.name as category_name, c.slug as category_slug, c.color as category_color,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += ' AND c.slug = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Sorting
  switch (sort) {
    case 'new':
      query += ' ORDER BY p.created_at DESC';
      break;
    case 'top':
      query += ' ORDER BY (p.upvotes - p.downvotes) DESC';
      break;
    case 'hot':
    default:
      query += ' ORDER BY p.is_pinned DESC, (p.upvotes - p.downvotes) / (julianday("now") - julianday(p.created_at) + 1) DESC';
      break;
  }

  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(query, params, (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const countParams = [];

    if (category) {
      countQuery += ' AND c.slug = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    db.get(countQuery, countParams, (err, count) => {
      res.json({
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content,
          upvotes: p.upvotes,
          downvotes: p.downvotes,
          viewCount: p.view_count,
          commentCount: p.comment_count,
          isPinned: p.is_pinned,
          isLocked: p.is_locked,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          author: {
            id: p.user_id,
            username: p.username,
            displayName: p.display_name,
            avatarUrl: p.avatar_url
          },
          category: p.category_id ? {
            id: p.category_id,
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

// Get single post
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // Increment view count
  db.run('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [id]);

  const query = `
    SELECT p.*, u.username, u.display_name, u.avatar_url, u.karma,
    c.name as category_name, c.slug as category_slug, c.color as category_color,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `;

  db.get(query, [id], (err, post) => {
    if (err || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      id: post.id,
      title: post.title,
      content: post.content,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      viewCount: post.view_count,
      commentCount: post.comment_count,
      isPinned: post.is_pinned,
      isLocked: post.is_locked,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: {
        id: post.user_id,
        username: post.username,
        displayName: post.display_name,
        avatarUrl: post.avatar_url,
        karma: post.karma
      },
      category: post.category_id ? {
        id: post.category_id,
        name: post.category_name,
        slug: post.category_slug,
        color: post.category_color
      } : null
    });
  });
});

// Create post
router.post('/', authMiddleware, [
  body('title').trim().isLength({ min: 5, max: 300 }),
  body('content').trim().isLength({ min: 10 }),
  body('categoryId').optional().isInt()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, content, categoryId } = req.body;

  db.run(
    'INSERT INTO posts (title, content, user_id, category_id) VALUES (?, ?, ?, ?)',
    [title, content, req.user.id, categoryId || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create post' });
      }

      res.status(201).json({
        message: 'Post created successfully',
        postId: this.lastID
      });
    }
  );
});

// Update post
router.put('/:id', authMiddleware, [
  body('title').optional().trim().isLength({ min: 5, max: 300 }),
  body('content').optional().trim().isLength({ min: 10 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { title, content } = req.body;

  // Check if user owns the post
  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
    if (err || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = [];
    const params = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    if (content) {
      updates.push('content = ?');
      params.push(content);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.run(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`,
      params,
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update post' });
        }
        res.json({ message: 'Post updated successfully' });
      }
    );
  });
});

// Delete post
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
    if (err || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run('DELETE FROM posts WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete post' });
      }
      res.json({ message: 'Post deleted successfully' });
    });
  });
});

// Pin/Unpin post (admin only)
router.patch('/:id/pin', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { isPinned } = req.body;

  db.run('UPDATE posts SET is_pinned = ? WHERE id = ?', [isPinned ? 1 : 0, id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update post' });
    }
    res.json({ message: 'Post updated successfully' });
  });
});

// Lock/Unlock post (admin only)
router.patch('/:id/lock', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { isLocked } = req.body;

  db.run('UPDATE posts SET is_locked = ? WHERE id = ?', [isLocked ? 1 : 0, id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update post' });
    }
    res.json({ message: 'Post updated successfully' });
  });
});

module.exports = router;
