module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATA_BASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
    migrations: {
      tableName: 'knex_migrations'
    }
  },
  test: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5433,
      database: 'test_database',
      user: 'test_user',
      password: 'test_password'
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
