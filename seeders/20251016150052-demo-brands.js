'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('brands', [
      {
        name: 'Mikasa',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Molten',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Wilson',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Nike',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Adidas',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Puma',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('brands', null, {});
  }
};
