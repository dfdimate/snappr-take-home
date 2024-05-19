import { Knex } from 'knex';

interface KnexConfig {
  development: Knex.Config;
  test: Knex.Config;
}

const knexConfig: KnexConfig;

export = knexConfig;
