'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('products', [
      {
        name: 'Remera Z6 Match Oficial',
        description: 'Camiseta de juego con cuello en V anatómico y corte de sisa raglán corrida. Elimina costuras sobre la articulación para una batida limpia.',
        price: 25900.00,
        stock: 50,
        image: '/img/products/nike-camiseta.jpg',
        category_id: 1, // Indumentaria
        brand_id: 1, // Zona 6
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Calzas Z6 Slide',
        description: 'Laterales de cadera y muslos confeccionados con poliamida y elastano de alta densidad. Diseñadas para soportar el deslizamiento sobre parquet o sintético sin desgarrarse.',
        price: 22500.00,
        stock: 40,
        image: '/img/products/calza.png',
        category_id: 1, // Indumentaria
        brand_id: 1, // Zona 6
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Buzo Térmico Z6 Baseline',
        description: 'Buzo térmico half-zip con calce entallado pensado para traslados y descansos entre sets.',
        price: 45000.00,
        stock: 20,
        image: '/img/products/manga.jpg',
        category_id: 1,
        brand_id: 1,
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Rodilleras Z6 Defensor',
        description: 'Protección integral y compacta. Espuma de alta densidad para máxima absorción de impacto sin perder movilidad.',
        price: 18000.00,
        stock: 60,
        image: '/img/products/rodillera.jpg',
        category_id: 2, // Rodilleras
        brand_id: 1,
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bolso Z6 Pro Tour',
        description: 'Bolso amplio para todo tu equipamiento. Compartimento especial para zapatillas y ropa húmeda.',
        price: 55000.00,
        stock: 15,
        image: 'default.jpg',
        category_id: 3, // Bolsos
        brand_id: 1,
        user_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Medias de Compresión Z6',
        description: 'Medias largas con ajuste en tobillo y arco. Previenen calambres y mejoran la circulación durante el partido.',
        price: 8500.00,
        stock: 100,
        image: 'default.jpg',
        category_id: 4, // Medias
        brand_id: 1,
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
