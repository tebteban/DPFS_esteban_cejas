'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('products', [
      {
        name: 'Pelota de Vóley Mikasa V200W',
        description: 'Pelota oficial de competiciones FIVB. Superficie de microfibra con 18 paneles aerodinámicos.',
        price: 39999.99,
        stock: 25,
        image: '/img/mikasa-v200w.jpg',
        category_id: 2, // Pelotas
        brand_id: 1, // Mikasa
        user_id: 1, // Usuario creador
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pelota de Entrenamiento Molten V5M5000',
        description: 'Balón profesional de entrenamiento, construcción resistente y agarre óptimo.',
        price: 28999.99,
        stock: 30,
        image: '/img/molten-v5m5000.jpg',
        category_id: 2, // Pelotas
        brand_id: 2, // Molten
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Zapatillas Nike Volley Zoom HyperAce 2',
        description: 'Zapatillas diseñadas para jugadoras de vóley. Excelente amortiguación y agarre.',
        price: 59999.99,
        stock: 12,
        image: '/img/nike-hyperace.jpg',
        category_id: 3, // Calzado
        brand_id: 4, // Nike
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Rodillera Profesional Adidas Elite',
        description: 'Protección avanzada para rodillas, con ajuste ergonómico y ventilación.',
        price: 14999.99,
        stock: 40,
        image: '/img/adidas-rodillera.jpg',
        category_id: 4, // Accesorios
        brand_id: 5, // Adidas
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Red de Competición Profesional',
        description: 'Red de vóley con tensores de acero y bordes reforzados, ideal para torneos oficiales.',
        price: 74999.99,
        stock: 10,
        image: '/img/red-profesional.jpg',
        category_id: 5, // Equipamiento Deportivo
        brand_id: 3, // Wilson
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  }
};
