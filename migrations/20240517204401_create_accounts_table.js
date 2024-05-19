/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.createTable('accounts', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('type').notNullable(); // e.g., 'debit', 'credit'
      table.integer('balance').defaultTo(0);
      table.timestamps(true, true);
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    await knex.schema.dropTable('accounts');
  };
  