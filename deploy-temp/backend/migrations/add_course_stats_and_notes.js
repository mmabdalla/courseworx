const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create course_stats table
    await queryInterface.createTable('course_stats', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true
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
        type: DataTypes.INTEGER,
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create user_notes table
    await queryInterface.createTable('user_notes', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      courseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      contentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'course_content',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('course_stats', ['courseId']);
    await queryInterface.addIndex('user_notes', ['userId', 'courseId']);
    await queryInterface.addIndex('user_notes', ['courseId', 'contentId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_notes');
    await queryInterface.dropTable('course_stats');
  }
};
