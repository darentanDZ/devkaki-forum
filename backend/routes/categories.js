const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', (req, res) => {
  const query = `
    SELECT c.*, COUNT(p.id) as post_count
    FROM categories c
    LEFT JOIN posts p ON c.id = p.category_id
    GROUP BY c.id
    ORDER BY c.name ASC
  `;

  db.all(query, [], (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json(categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      color: c.color,
      postCount: c.post_count,
      createdAt: c.created_at
    })));
  });
});

// Get single category
router.get('/:slug', (req, res) => {
  const { slug } = req.params;

  db.get('SELECT * FROM categories WHERE slug = ?', [slug], (err, category) => {
    if (err || !category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      createdAt: category.created_at
    });
  });
});

// Create category (admin only)
router.post('/', authMiddleware, adminMiddleware, [
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('slug').trim().matches(/^[a-z0-9-]+$/),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9a-f]{6}$/i)
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, slug, description, color } = req.body;

  db.run(
    'INSERT INTO categories (name, slug, description, color) VALUES (?, ?, ?, ?)',
    [name, slug, description || null, color || '#3b82f6'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Category name or slug already exists' });
        }
        return res.status(500).json({ error: 'Failed to create category' });
      }

      res.status(201).json({
        message: 'Category created successfully',
        categoryId: this.lastID
      });
    }
  );
});

// Update category (admin only)
router.put('/:id', authMiddleware, adminMiddleware, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9a-f]{6}$/i)
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, color } = req.body;

  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (color) {
    updates.push('color = ?');
    params.push(color);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  params.push(id);

  db.run(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    params,
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update category' });
      }
      res.json({ message: 'Category updated successfully' });
    }
  );
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  // Check if category has posts
  db.get('SELECT COUNT(*) as count FROM posts WHERE category_id = ?', [id], (err, result) => {
    if (result.count > 0) {
      return res.status(400).json({ error: 'Cannot delete category with posts' });
    }

    db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete category' });
      }
      res.json({ message: 'Category deleted successfully' });
    });
  });
});

module.exports = router;
