'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add courseType column with default value 'online'
    await queryInterface.addColumn('courses', 'courseType', {
      type: Sequelize.ENUM('online', 'classroom', 'hybrid'),
      allowNull: false,
      defaultValue: 'online'
    });

    // Add location column for classroom/hybrid courses
    await queryInterface.addColumn('courses', 'location', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add recording options columns
    await queryInterface.addColumn('courses', 'allowRecording', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('courses', 'recordForReplay', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('courses', 'recordForFutureStudents', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    // Add index for better performance
    await queryInterface.addIndex('courses', ['courseType']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index first
    await queryInterface.removeIndex('courses', ['courseType']);
    
    // Remove all added columns
    await queryInterface.removeColumn('courses', 'courseType');
    await queryInterface.removeColumn('courses', 'location');
    await queryInterface.removeColumn('courses', 'allowRecording');
    await queryInterface.removeColumn('courses', 'recordForReplay');
    await queryInterface.removeColumn('courses', 'recordForFutureStudents');
    
    // Drop the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_courses_courseType";');
  }
};
