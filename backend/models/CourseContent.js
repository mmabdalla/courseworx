const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourseContent = sequelize.define('CourseContent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('document', 'image', 'video', 'article', 'quiz', 'certificate'),
    allowNull: false
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER, // in bytes
    allowNull: true
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds, for videos
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  // For quizzes
  quizData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  // For articles
  articleContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // For certificates
  certificateTemplate: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'course_contents',
  indexes: [
    {
      fields: ['courseId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isPublished']
    },
    {
      fields: ['order']
    }
  ]
});

module.exports = CourseContent; 