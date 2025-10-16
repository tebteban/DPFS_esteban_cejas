'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Indumentaria',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pelotas',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Calzado',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Accesorios',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Equipamiento Deportivo',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
