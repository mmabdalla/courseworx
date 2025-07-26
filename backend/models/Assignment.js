const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  maxScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    validate: {
      min: 1,
      max: 1000
    }
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 10.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  type: {
    type: DataTypes.ENUM('homework', 'quiz', 'project', 'exam', 'presentation'),
    allowNull: false,
    defaultValue: 'homework'
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowLateSubmission: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  latePenalty: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  rubric: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'assignments',
  indexes: [
    {
      fields: ['courseId']
    },
    {
      fields: ['trainerId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isPublished']
    }
  ]
});

module.exports = Assignment; 