const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

/**************
 * Posts
 * ************/

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(request.user.id).select('-password');

      const newPost = new Post({
        text: request.body.text,
        name: user.name,
        avatar: user.avatar,
        user: request.user.id
      });

      const post = await newPost.save();

      response.json(post);
    } catch (err) {
      console.error(err.message);
      response.status(500).send('Server Error');
    }
  }
);

// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get('/', auth, async (request, response) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    response.json(posts);
  } catch (err) {
    console.error(err.message);
    response.status(500).send('Server Error');
  }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get('/:id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    if (!post) {
      return response.status(404).json({ msg: 'Post not found' });
    }

    response.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return response.status(404).json({ msg: 'Post not found' });
    }
    response.status(500).send('Server Error');
  }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    if (!post) {
      return response.status(404).json({ msg: 'Post not found' });
    }

    // Check user
    if (post.user.toString() !== request.user.id) {
      return response.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();

    response.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return response.status(404).json({ msg: 'Post not found' });
    }
    response.status(500).send('Server Error');
  }
});

/**************
 * Likes
 * ************/

// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    // Check if the post has already been liked
    if (
      post.likes.filter(like => like.user.toString() === request.user.id)
        .length > 0
    ) {
      return response.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: request.user.id });

    await post.save();

    response.json(post.likes);
  } catch (err) {
    console.error(err.message);
    response.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/unlike/:id
// @desc     Like a post
// @access   Private
router.put('/unlike/:id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    // Check if the post has already been liked
    if (
      post.likes.filter(like => like.user.toString() === request.user.id)
        .length === 0
    ) {
      return response.status(400).json({ msg: 'Post has not yet been liked' });
    }

    // Get remove index
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(request.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    response.json(post.likes);
  } catch (err) {
    console.error(err.message);
    response.status(500).send('Server Error');
  }
});

/**************
 * Comments
 * ************/

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(request.user.id).select('-password');
      const post = await Post.findById(request.params.id);

      const newComment = {
        text: request.body.text,
        name: user.name,
        avatar: user.avatar,
        user: request.user.id
      };

      post.comments.unshift(newComment);

      await post.save();

      response.json(post.comments);
    } catch (err) {
      console.error(err.message);
      response.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    // Pull out comment
    const comment = post.comments.find(
      comment => comment.id === request.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return response.status(404).json({ msg: 'Comment does not exist' });
    }

    // Check user
    if (comment.user.toString() !== request.user.id) {
      return response.status(401).json({ msg: 'User not authorized' });
    }

    // Get remove index
    const removeIndex = post.comments
      .map(comment => comment.id)
      .indexOf(request.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    response.json(post.comments);
  } catch (err) {
    console.error(err.message);
    response.status(500).send('Server Error');
  }
});

module.exports = router;
