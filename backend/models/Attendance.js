const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  signInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  signOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'early_departure'),
    allowNull: false,
    defaultValue: 'present'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviceInfo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'attendance',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['courseId']
    },
    {
      fields: ['date']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Attendance; 