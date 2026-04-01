const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LessonCompletion = sequelize.define('LessonCompletion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  timeSpent: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true,
    defaultValue: 0
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'lesson_completions',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['courseId']
    },
    {
      fields: ['contentId']
    },
    {
      fields: ['userId', 'courseId']
    },
    {
      fields: ['userId', 'contentId']
    }
  ]
});

module.exports = LessonCompletion;
