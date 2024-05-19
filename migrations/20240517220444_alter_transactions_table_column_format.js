/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.alterTable('transactions', (table) => {
      table.dropColumn('transacted_at');
      table.dropColumn('booking_completion');
    });
  
    await knex.schema.alterTable('transactions', (table) => {
      table.timestamp('transacted_at', { useTz: true }).nullable();
      table.timestamp('booking_completion', { useTz: true }).nullable();
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    await knex.schema.alterTable('transactions', (table) => {
      table.dropColumn('transacted_at');
      table.dropColumn('booking_completion');
    });
  
    await knex.schema.alterTable('transactions', (table) => {
      table.timestamp('transacted_at', { useTz: true }).notNullable();
      table.timestamp('booking_completion', { useTz: true }).notNullable();
    });
  };
  