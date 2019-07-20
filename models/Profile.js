const mongoose = require('mongoose');

// Create Schema
const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  website: {
    type: String
  },
  location: {
    type: String
  },
  genres: {
    type: [String],
    required: true
  },
  skills: {
    type: [String]
  },
  bio: {
    type: String
  },
  githubusername: {
    type: String
  },
  agent: {
    type: String
  },
  publications: [
    {
      title: {
        type: String,
        required: true
      },
      publicationMedium: {
        type: String
      },
      publicationDate: {
        type: Date,
        required: true
      },
      description: {
        type: String
      }
    }
  ],
  career: [
    {
      jobTitle: {
        type: String
      },
      company: {
        type: String
      },
      website: {
        type: String
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String
      }
    }
  ],
  education: [
    {
      school: {
        type: String,
        required: true
      },
      degree: {
        type: String,
        required: true
      },
      fieldOfstudy: {
        type: String,
        required: true
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String
      }
    }
  ],
  social: {
    youtube: {
      type: String
    },
    twitter: {
      type: String
    },
    facebook: {
      type: String
    },
    linkedin: {
      type: String
    },
    instagram: {
      type: String
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
