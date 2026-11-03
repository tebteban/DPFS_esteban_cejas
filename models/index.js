'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // SQLite: las transacciones toman el lock de escritura al empezar (IMMEDIATE) para que dos compras simultáneas
  // se pongan en fila en vez de chocar con SQLITE_BUSY
  sequelize = new Sequelize(config.database, config.username, config.password,
    config.dialect === 'sqlite' ? { transactionType: 'IMMEDIATE', ...config } : config);
}

if (sequelize.getDialect() === 'sqlite') {
  // Sequelize no configura espera: sin esto, si la base está ocupada falla al instante en vez de esperar su turno
  const connectionManager = sequelize.connectionManager;
  const getConnection = connectionManager.getConnection.bind(connectionManager);
  connectionManager.getConnection = async (options) => {
    const connection = await getConnection(options);
    connection.configure('busyTimeout', 15000);
    return connection;
  };

  // SQLite admite un solo escritor. Si muchas transacciones esperan el lock a la vez, ocupan los 4 hilos del driver
  // y la que tiene el lock no puede terminar (se traban entre sí). Por eso las ponemos en fila dentro del proceso.
  // Ojo: no abrir una transacción dentro de otra, porque esperaría a sí misma.
  let queue = Promise.resolve();
  const transaction = sequelize.transaction.bind(sequelize);
  sequelize.transaction = (options, autoCallback) => {
    if (typeof options === 'function') [options, autoCallback] = [{}, options];
    if (!autoCallback) return transaction(options);
    const run = queue.then(() => transaction(options, autoCallback));
    queue = run.catch(() => {});
    return run;
  };
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
