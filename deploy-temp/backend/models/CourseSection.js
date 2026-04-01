const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourseSection = sequelize.define('CourseSection', {
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
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isCollapsible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isExpanded: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'course_sections',
  indexes: [
    {
      fields: ['courseId']
    },
    {
      fields: ['order']
    }
  ]
});

module.exports = CourseSection;
