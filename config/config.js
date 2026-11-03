module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './database.sqlite'
  },
  test: {
    dialect: 'sqlite',
    // Las pruebas crean una base descartable y pasan su ruta acá (ver tests/helpers.js)
    storage: process.env.DB_STORAGE || ':memory:',
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
