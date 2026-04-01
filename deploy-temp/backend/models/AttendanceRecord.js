const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'classroom_sessions',
      key: 'id'
    }
  },
  traineeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Device identifier for anonymous check-ins'
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkInMethod: {
    type: DataTypes.ENUM('qr_code', 'manual', 'admin'),
    defaultValue: 'qr_code'
  },
  checkOutMethod: {
    type: DataTypes.ENUM('qr_code', 'manual', 'admin'),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('present', 'late', 'absent', 'left_early', 'checked_out'),
    defaultValue: 'present'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPresent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  }
}, {
  tableName: 'attendance_records',
  indexes: [
    {
      fields: ['sessionId']
    },
    {
      fields: ['traineeId']
    },
    {
      fields: ['checkInTime']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['sessionId', 'traineeId'],
      where: {
        traineeId: {
          [require('sequelize').Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['sessionId', 'deviceId'],
      where: {
        deviceId: {
          [require('sequelize').Op.ne]: null
        }
      }
    }
  ]
});

module.exports = AttendanceRecord;


