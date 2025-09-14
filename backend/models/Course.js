const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trainerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shortDescription: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  courseType: {
    type: DataTypes.ENUM('online', 'classroom', 'hybrid'),
    allowNull: false,
    defaultValue: 'online',
    validate: {
      notEmpty: true,
      isIn: [['online', 'classroom', 'hybrid']]
    }
  },
  language: {
    type: DataTypes.ENUM('english', 'arabic', 'french', 'spanish', 'german', 'chinese', 'japanese', 'korean', 'hindi', 'other'),
    allowNull: false,
    defaultValue: 'english',
    validate: {
      notEmpty: true,
      isIn: [['english', 'arabic', 'french', 'spanish', 'german', 'chinese', 'japanese', 'korean', 'hindi', 'other']]
    }
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false,
    defaultValue: 'beginner'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  learningOutcomes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  curriculum: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  enrolledStudents: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  allowRecording: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recordForReplay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recordForFutureStudents: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'courses',
  indexes: [
    {
      fields: ['trainerId']
    },
    {
      fields: ['category']
    },
    {
      fields: ['isPublished']
    },
    {
      fields: ['isFeatured']
    },
    {
      fields: ['courseType']
    },
    {
      fields: ['language']
    }
  ]
});

module.exports = Course; 