"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("facts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      wallet_address: {
        type: Sequelize.STRING,
      },
      statement: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add index on wallet_address
    await queryInterface.addIndex("facts", ["wallet_address"]);
  },
  async down(queryInterface) {
    // Remove index on wallet_address
    await queryInterface.removeIndex("facts", ["wallet_address"]);

    await queryInterface.dropTable("facts");
  },
};
