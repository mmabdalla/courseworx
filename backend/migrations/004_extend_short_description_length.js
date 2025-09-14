'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Extend shortDescription column length to accommodate longer Arabic text
    await queryInterface.changeColumn('courses', 'shortDescription', {
      type: Sequelize.STRING(1000),
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to original length
    await queryInterface.changeColumn('courses', 'shortDescription', {
      type: Sequelize.STRING(500),
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    });
  }
};
