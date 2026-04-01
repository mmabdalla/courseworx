const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserNotes = sequelize.define('UserNotes', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: true, // null for course-level notes
      references: {
        model: 'course_contents',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    tabType: {
      type: DataTypes.ENUM('overview', 'notes', 'announcements', 'reviews', 'learning-tools', 'resources', 'analysis'),
      allowNull: false,
      defaultValue: 'notes'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'user_notes',
    timestamps: true
  });

  UserNotes.associate = (models) => {
    UserNotes.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    UserNotes.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course'
    });
    
    UserNotes.belongsTo(models.CourseContent, {
      foreignKey: 'contentId',
      as: 'content'
    });
  };

  return UserNotes;
};
