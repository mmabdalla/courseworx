const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizQuestion = sequelize.define('QuizQuestion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  questionType: {
    type: DataTypes.ENUM('multiple_choice', 'single_choice', 'true_false', 'text', 'file_upload'),
    allowNull: false,
    defaultValue: 'multiple_choice'
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  correctAnswer: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'quiz_questions',
  indexes: [
    {
      fields: ['contentId']
    },
    {
      fields: ['questionType']
    },
    {
      fields: ['order']
    }
  ]
});

module.exports = QuizQuestion; 