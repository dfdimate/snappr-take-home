/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  await knex.schema.createTable('partner', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.timestamps(true, true);

    table.string('name').notNullable();
    table.string('slug').notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('partner');
};
