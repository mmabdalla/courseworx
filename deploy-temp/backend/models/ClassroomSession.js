const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClassroomSession = sequelize.define('ClassroomSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  sessionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qrCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  qrCodeExpiry: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  maxCapacity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  }
}, {
  tableName: 'classroom_sessions',
  indexes: [
    {
      fields: ['courseId']
    },
    {
      fields: ['sessionDate']
    },
    {
      fields: ['qrCode']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = ClassroomSession;


