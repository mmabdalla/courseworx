'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('courses', 'language', {
      type: Sequelize.ENUM('english', 'arabic', 'french', 'spanish', 'german', 'chinese', 'japanese', 'korean', 'hindi', 'other'),
      allowNull: false,
      defaultValue: 'english'
    });
    
    await queryInterface.addIndex('courses', ['language']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('courses', ['language']);
    await queryInterface.removeColumn('courses', 'language');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_courses_language";');
  }
};
