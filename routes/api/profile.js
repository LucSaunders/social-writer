const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

// Load Profile Model
const Profile = require('../../models/Profile');
// Load User Model
const User = require('../../models/User');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (request, response) =>
  response.json({ msg: 'Profile Works' })
);

// @route   GET api/profile
// @desc    Get current users profile
// @access  Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    const errors = {};

    Profile.findOne({ user: request.user.id })
      .populate('user', ['name', 'avatar'])
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return response.status(404).json(errors);
        }
        response.json(profile);
      })
      .catch(error => response.status(404).json(error));
  }
);

// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', (request, response) => {
  const errors = {};

  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles';
        return response.status(404).json(errors);
      }

      response.json(profiles);
    })
    .catch(error =>
      response.status(404).json({ profile: 'There are no profiles' })
    );
});

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public

router.get('/handle/:handle', (request, response) => {
  const errors = {};

  Profile.findOne({ handle: request.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        response.status(404).json(errors);
      }

      response.json(profile);
    })
    .catch(error => response.status(404).json(error));
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public

router.get('/user/:user_id', (request, response) => {
  const errors = {};

  Profile.findOne({ user: request.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        response.status(404).json(errors);
      }

      response.json(profile);
    })
    .catch(error =>
      response
        .status(404)
        .json({ profile: 'There is no profile for this user' })
    );
});

// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    const { errors, isValid } = validateProfileInput(request.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return response.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    profileFields.user = request.user.id;
    if (request.body.handle) profileFields.handle = request.body.handle;
    if (request.body.company) profileFields.company = request.body.company;
    if (request.body.website) profileFields.website = request.body.website;
    if (request.body.location) profileFields.location = request.body.location;
    if (request.body.bio) profileFields.bio = request.body.bio;
    if (request.body.status) profileFields.status = request.body.status;
    if (request.body.githubusername)
      profileFields.githubusername = request.body.githubusername;
    // Skills - Spilt into array
    if (typeof request.body.skills !== 'undefined') {
      profileFields.skills = request.body.skills.split(',');
    }

    // Social
    profileFields.social = {};
    if (request.body.youtube)
      profileFields.social.youtube = request.body.youtube;
    if (request.body.twitter)
      profileFields.social.twitter = request.body.twitter;
    if (request.body.facebook)
      profileFields.social.facebook = request.body.facebook;
    if (request.body.linkedin)
      profileFields.social.linkedin = request.body.linkedin;
    if (request.body.instagram)
      profileFields.social.instagram = request.body.instagram;

    Profile.findOne({ user: request.user.id }).then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: request.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => response.json(profile));
      } else {
        // Create

        // Check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = 'That handle already exists';
            response.status(400).json(errors);
          }

          // Save Profile
          new Profile(profileFields)
            .save()
            .then(profile => response.json(profile));
        });
      }
    });
  }
);

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
  '/experience',
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    const { errors, isValid } = validateExperienceInput(request.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return response.status(400).json(errors);
    }

    Profile.findOne({ user: request.user.id }).then(profile => {
      const newExp = {
        title: request.body.title,
        company: request.body.company,
        location: request.body.location,
        from: request.body.from,
        to: request.body.to,
        current: request.body.current,
        description: request.body.description
      };

      // Add to exp array
      profile.experience.unshift(newExp);

      profile.save().then(profile => response.json(profile));
    });
  }
);

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post(
  '/education',
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    const { errors, isValid } = validateEducationInput(request.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return response.status(400).json(errors);
    }

    Profile.findOne({ user: request.user.id }).then(profile => {
      const newEdu = {
        school: request.body.school,
        degree: request.body.degree,
        fieldofstudy: request.body.fieldofstudy,
        from: request.body.from,
        to: request.body.to,
        current: request.body.current,
        description: request.body.description
      };

      // Add to exp array
      profile.education.unshift(newEdu);

      profile.save().then(profile => response.json(profile));
    });
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete(
  '/experience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    Profile.findOne({ user: request.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(request.params.exp_id);

        // Splice out of array
        profile.experience.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => response.json(profile));
      })
      .catch(error => response.status(404).json(error));
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete(
  '/education/:edu_id',
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    Profile.findOne({ user: request.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(request.params.edu_id);

        // Splice out of array
        profile.education.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => response.json(profile));
      })
      .catch(error => response.status(404).json(error));
  }
);

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete(
  '/',
  passport.authenticate('jwt', { session: false }),
  (request, response) => {
    Profile.findOneAndRemove({ user: request.user.id }).then(() => {
      User.findOneAndRemove({ _id: request.user.id }).then(() =>
        response.json({ success: true })
      );
    });
  }
);

module.exports = router;
