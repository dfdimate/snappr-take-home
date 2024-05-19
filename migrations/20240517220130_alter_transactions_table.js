/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.alterTable('transactions', (table) => {
      table.dropColumn('booking_completion');
    });
  
    await knex.schema.alterTable('transactions', (table) => {
      table.timestamp('booking_completion').nullable();
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    await knex.schema.alterTable('transactions', (table) => {
      table.dropColumn('booking_completion');
    });
  
    await knex.schema.alterTable('transactions', (table) => {
      table.boolean('booking_completion').defaultTo(false);
    });
  };
  