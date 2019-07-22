const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

// Load Profile Model
const Profile = require('../../models/Profile');

// Load User Model
const User = require('../../models/User');

/********************
 * GET Routes
 *******************/

// @route    GET api/profile/me
// @desc     Get current user's profile
// @access   Private
router.get('/me', auth, async (request, response) => {
  try {
    const profile = await Profile.findOne({ user: request.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    if (!profile) {
      return response
        .status(400)
        .json({ msg: 'There is no profile for this user' });
    }

    response.json(profile);
  } catch (error) {
    console.error(error.message);
    response.status(500).send('Server Error');
  }
});

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (request, response) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    response.json(profiles);
  } catch (error) {
    console.error(error.message);
    response.status(500).send('Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (request, response) => {
  try {
    const profile = await Profile.findOne({
      user: request.params.user_id
    }).populate('user', ['name', 'avatar']);

    if (!profile)
      return response.status(400).json({ msg: 'Profile not found' });

    response.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') {
      return response.status(400).json({ msg: 'Profile not found' });
    }
    response.status(500).send('Server Error');
  }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=6&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/********************
 * POST Routes
 ********************/

// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('genres', 'Genre is required')
        .not()
        .isEmpty()
    ]
  ],
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    const {
      website,
      location,
      genres,
      bio,
      githubusername,
      agent,
      specialties,
      influences,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram
    } = request.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = request.user.id;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (genres) {
      profileFields.genres = genres.split(',').map(genre => genre.trim());
    }
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;
    if (agent) profileFields.agent = agent;
    if (specialties) {
      profileFields.specialties = specialties
        .split(',')
        .map(specialty => specialty.trim());
    }
    if (influences) {
      profileFields.influences = influences
        .split(',')
        .map(influence => influence.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: request.user.id });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: request.user.id },
          { $set: profileFields },
          { new: true }
        );

        return response.json(profile);
      }

      // Create
      profile = new Profile(profileFields);

      await profile.save();
      response.json(profile);
    } catch (error) {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
);

/********************
 * PUT Routes
 ********************/

// @route    PUT api/profile/publications
// @desc     Add profile publications
// @access   Private
router.put(
  '/publications',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('publisher', 'Publisher is required')
        .not()
        .isEmpty(),
      check('publicationDate', 'Publication date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (request, response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    const { title, publisher, publicationDate, description } = request.body;

    const newPub = {
      title,
      publisher,
      publicationDate,
      description
    };

    try {
      const profile = await Profile.findOne({ user: request.user.id });

      profile.publications.unshift(newPub);

      await profile.save();

      response.json(profile);
    } catch (err) {
      console.error(err.message);
      response.status(500).send('Server Error');
    }
  }
);

// @route    PUT api/profile/career
// @desc     Add profile career
// @access   Private
router.put(
  '/career',
  [
    auth,
    [
      check('jobTitle', 'Job title is required')
        .not()
        .isEmpty(),
      check('company', 'Company is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    const {
      jobTitle,
      company,
      website,
      from,
      to,
      current,
      description
    } = request.body;

    const newJob = {
      jobTitle,
      company,
      website,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: request.user.id });

      profile.career.unshift(newJob);

      await profile.save();

      response.json(profile);
    } catch (error) {
      console.error(error.message);
      response.status(500).send('Server Error');
    }
  }
);

// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'Field of study is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (request, response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = request.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: request.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      response.json(profile);
    } catch (err) {
      console.error(err.message);
      response.status(500).send('Server Error');
    }
  }
);

/********************
 * DELETE Routes
 ********************/

// @route   DELETE api/profile/publications/:pub_id
// @desc    Delete publications from profile
// @access  Private
// router.delete('/publications/:pub_id', auth, async (request, response) => {
//   try {
//     const profile = await Profile.findOne({ user: request.user.id });

//     // Get remove index
//     const removeIndex = profile.publications
//       .map(item => item.id)
//       .indexOf(request.params.pub_id);

//     profile.publications.splice(removeIndex, 1);

//     await profile.save();

//     response.json(profile);
//   } catch (err) {
//     console.error(err.message);
//     response.status(500).send('Server Error');
//   }
// });

router.delete('/publications/:pub_id', auth, async (request, response) => {
  try {
    const foundProfile = await Profile.findOne({ user: request.user.id });
    const pubIds = foundProfile.publications.map(pub => pub._id.toString());
    // if i dont add .toString() it returns this weird mongoose coreArray and the ids are somehow objects and it still deletes anyway even if you put /publications/5
    const removeIndex = pubIds.indexOf(request.params.pub_id);
    if (removeIndex === -1) {
      return response.status(500).json({ msg: 'Server error' });
    } else {
      // theses console logs helped me figure it out
      console.log('pubIds', pubIds);
      console.log('typeof pubIds', typeof pubIds);
      console.log('request.params', request.params);
      console.log('removed', pubIds.indexOf(request.params.pub_id));
      foundProfile.publications.splice(removeIndex, 1);
      await foundProfile.save();
      return response.status(200).json(foundProfile);
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ msg: 'Server error' });
  }
});

// @route    DELETE api/profile/career/:job_id
// @desc     Delete career from profile
// @access   Private
// router.delete('/career/:job_id', auth, async (request, response) => {
//   try {
//     const profile = await Profile.findOne({ user: request.user.id });

//     // Get remove index
//     const removeIndex = profile.career
//       .map(item => item.id)
//       .indexOf(request.params.job_id);

//     profile.career.splice(removeIndex, 1);

//     await profile.save();

//     response.json(profile);
//   } catch (err) {
//     console.error(err.message);
//     response.status(500).send('Server Error');
//   }
// });

router.delete('/career/:job_id', auth, async (request, response) => {
  try {
    const foundProfile = await Profile.findOne({ user: request.user.id });
    const jobIds = foundProfile.career.map(job => job._id.toString());
    // if i dont add .toString() it returns this weird mongoose coreArray and the ids are somehow objects and it still deletes anyway even if you put /career/5
    const removeIndex = jobIds.indexOf(request.params.job_id);
    if (removeIndex === -1) {
      return response.status(500).json({ msg: 'Server error' });
    } else {
      // theses console logs helped me figure it out
      // console.log("jobIds", jobIds);
      // console.log("typeof jobIds", typeof jobIds);
      // console.log("request.params", request.params);
      // console.log("removed", jobIds.indexOf(request.params.job_id));
      foundProfile.career.splice(removeIndex, 1);
      await foundProfile.save();
      return response.status(200).json(foundProfile);
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ msg: 'Server error' });
  }
});

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private
//router.delete('/education/:edu_id', auth, async (request, response) => {
//try {
//const profile = await Profile.findOne({ user: request.user.id });

// Get remove index
//const removeIndex = profile.education
//.map(item => item.id)
//.indexOf(request.params.edu_id);
/*
    profile.education.splice(removeIndex, 1);

    await profile.save();

    response.json(profile);
  } catch (err) {
    console.error(err.message);
    response.status(500).send('Server Error');
  }
});
*/

router.delete('/education/:edu_id', auth, async (request, response) => {
  try {
    const foundProfile = await Profile.findOne({ user: request.user.id });
    const eduIds = foundProfile.education.map(edu => edu._id.toString());
    // if i dont add .toString() it returns a weird mongoose coreArray and the ids are somehow objects and it still deletes anyway even if you put /education/5
    const removeIndex = eduIds.indexOf(request.params.edu_id);
    if (removeIndex === -1) {
      return response.status(500).json({ msg: 'Server error' });
    } else {
      // theses console logs helped me figure it out
      /*   console.log("eduIds", eduIds);
      console.log("typeof eduIds", typeof eduIds);
      console.log("request.params", request.params);
      console.log("removed", eduIds.indexOf(request.params.edu_id));
 */ foundProfile.education.splice(
        removeIndex,
        1
      );
      await foundProfile.save();
      return response.status(200).json(foundProfile);
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/profile
// @desc    Delete user, profile, & posts
// @access  Private
router.delete('/', auth, async (request, response) => {
  try {
    // Remove user posts
    await Post.deleteMany({ user: request.user.id });
    // Remove profile
    await Profile.findOneAndRemove({ user: request.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: request.user.id });

    response.json({ msg: 'User deleted' });
  } catch (error) {
    console.error(error.message);
    response.status(500).send('Server Error');
  }
});

module.exports = router;
