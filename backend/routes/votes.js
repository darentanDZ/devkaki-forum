const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Vote on post
router.post('/post/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body; // 1 for upvote, -1 for downvote, 0 to remove vote

  if (![1, -1, 0].includes(voteType)) {
    return res.status(400).json({ error: 'Invalid vote type' });
  }

  // Check if post exists
  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
    if (err || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check existing vote
    db.get('SELECT * FROM post_votes WHERE user_id = ? AND post_id = ?',
      [req.user.id, id],
      (err, existingVote) => {
        if (voteType === 0) {
          // Remove vote
          if (existingVote) {
            db.run('DELETE FROM post_votes WHERE user_id = ? AND post_id = ?',
              [req.user.id, id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to remove vote' });
                }
                updatePostVoteCount(id, res);
              }
            );
          } else {
            return res.json({ message: 'No vote to remove' });
          }
        } else {
          // Add or update vote
          if (existingVote) {
            if (existingVote.vote_type === voteType) {
              return res.json({ message: 'Already voted' });
            }
            db.run('UPDATE post_votes SET vote_type = ? WHERE user_id = ? AND post_id = ?',
              [voteType, req.user.id, id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to update vote' });
                }
                updatePostVoteCount(id, res);
              }
            );
          } else {
            db.run('INSERT INTO post_votes (user_id, post_id, vote_type) VALUES (?, ?, ?)',
              [req.user.id, id, voteType],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to add vote' });
                }
                updatePostVoteCount(id, res);
              }
            );
          }
        }
      }
    );
  });
});

// Vote on comment
router.post('/comment/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body;

  if (![1, -1, 0].includes(voteType)) {
    return res.status(400).json({ error: 'Invalid vote type' });
  }

  db.get('SELECT * FROM comments WHERE id = ?', [id], (err, comment) => {
    if (err || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    db.get('SELECT * FROM comment_votes WHERE user_id = ? AND comment_id = ?',
      [req.user.id, id],
      (err, existingVote) => {
        if (voteType === 0) {
          if (existingVote) {
            db.run('DELETE FROM comment_votes WHERE user_id = ? AND comment_id = ?',
              [req.user.id, id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to remove vote' });
                }
                updateCommentVoteCount(id, res);
              }
            );
          } else {
            return res.json({ message: 'No vote to remove' });
          }
        } else {
          if (existingVote) {
            if (existingVote.vote_type === voteType) {
              return res.json({ message: 'Already voted' });
            }
            db.run('UPDATE comment_votes SET vote_type = ? WHERE user_id = ? AND comment_id = ?',
              [voteType, req.user.id, id],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to update vote' });
                }
                updateCommentVoteCount(id, res);
              }
            );
          } else {
            db.run('INSERT INTO comment_votes (user_id, comment_id, vote_type) VALUES (?, ?, ?)',
              [req.user.id, id, voteType],
              (err) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to add vote' });
                }
                updateCommentVoteCount(id, res);
              }
            );
          }
        }
      }
    );
  });
});

// Get user's votes for a post and its comments
router.get('/user/post/:postId', authMiddleware, (req, res) => {
  const { postId } = req.params;

  const postVoteQuery = 'SELECT vote_type FROM post_votes WHERE user_id = ? AND post_id = ?';
  const commentVotesQuery = `
    SELECT cv.comment_id, cv.vote_type
    FROM comment_votes cv
    JOIN comments c ON cv.comment_id = c.id
    WHERE cv.user_id = ? AND c.post_id = ?
  `;

  db.get(postVoteQuery, [req.user.id, postId], (err, postVote) => {
    db.all(commentVotesQuery, [req.user.id, postId], (err, commentVotes) => {
      const votes = {
        post: postVote?.vote_type || 0,
        comments: {}
      };

      commentVotes.forEach(cv => {
        votes.comments[cv.comment_id] = cv.vote_type;
      });

      res.json(votes);
    });
  });
});

// Helper functions
function updatePostVoteCount(postId, res) {
  db.all('SELECT vote_type FROM post_votes WHERE post_id = ?', [postId], (err, votes) => {
    const upvotes = votes.filter(v => v.vote_type === 1).length;
    const downvotes = votes.filter(v => v.vote_type === -1).length;

    db.run('UPDATE posts SET upvotes = ?, downvotes = ? WHERE id = ?',
      [upvotes, downvotes, postId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update vote count' });
        }
        res.json({ message: 'Vote recorded', upvotes, downvotes });
      }
    );
  });
}

function updateCommentVoteCount(commentId, res) {
  db.all('SELECT vote_type FROM comment_votes WHERE comment_id = ?', [commentId], (err, votes) => {
    const upvotes = votes.filter(v => v.vote_type === 1).length;
    const downvotes = votes.filter(v => v.vote_type === -1).length;

    db.run('UPDATE comments SET upvotes = ?, downvotes = ? WHERE id = ?',
      [upvotes, downvotes, commentId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update vote count' });
        }
        res.json({ message: 'Vote recorded', upvotes, downvotes });
      }
    );
  });
}

module.exports = router;
