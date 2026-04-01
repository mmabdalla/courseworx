const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CourseStats = sequelize.define('CourseStats', {
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
    rating: {
      type: DataTypes.DECIMAL(3, 2), // 4.50 format
      allowNull: true,
      validate: {
        min: 0,
        max: 5
      }
    },
    totalRatings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    enrollmentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalDuration: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: false,
      defaultValue: 0
    },
    skillLevel: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'English'
    },
    publishedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalLessons: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    certificateAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'course_stats',
    timestamps: true
  });

  CourseStats.associate = (models) => {
    CourseStats.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course'
    });
  };

  return CourseStats;
};
