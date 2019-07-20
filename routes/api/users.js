const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');

// From express-validator documentation
const { check, validationResult } = require('express-validator/check');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// Load User model
const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    // .not().isEmpty() from express-validator documentation
    check('name', 'Name is required')
      .not()
      .isEmpty(),

    // .isEmail() from express-validator documentation
    check('email', 'Please include a valid email').isEmail(),

    // .isLength() from express-validator documentation
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = request.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return response
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      const avatar = gravatar.url(email, {
        // string length
        s: '200',

        // rating
        r: 'pg',

        // default
        d: 'mm'
      });

      user = new User({
        name,
        email,
        avatar,
        password
      });

      // Encrypt password -- salt & hash, using promises
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Create payload object
      const payload = {
        user: {
          // Mongoose abstracts Mongo's _id to .id
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),

        // Set expiration to one hour
        { expiresIn: 3600 },

        (error, token) => {
          if (error) throw error;
          response.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);
      response.status(500).send('Server error');
    }
  }
);

module.exports = router;
