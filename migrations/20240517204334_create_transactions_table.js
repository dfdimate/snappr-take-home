/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.createTable('transactions', (table) => {
      table.uuid('uid').primary();
      table.integer('amount').notNullable();
      table.uuid('partner_uid').notNullable();
      table.foreign('partner_uid').references('id').inTable('partner');
      table.string('reason').notNullable();
      table.timestamp('transacted_at').notNullable();
      table.uuid('booking_uid').nullable();
      table.uuid('order_uid').nullable();
      table.boolean('booking_completion').defaultTo(false);
      table.integer('provider_pay').notNullable();
      table.timestamps(true, true);
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    await knex.schema.dropTable('transactions');
  };
  