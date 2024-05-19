/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.createTable('transaction_details', (table) => {
      table.increments('id').primary();
      table.uuid('transaction_uid').notNullable();
      table.foreign('transaction_uid').references('uid').inTable('transactions');
      table.integer('account_id').notNullable();
      table.foreign('account_id').references('id').inTable('accounts');
      table.string('type').notNullable(); // 'debit' or 'credit'
      table.integer('amount').notNullable();
      table.timestamps(true, true);
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    await knex.schema.dropTable('transaction_details');
  };
  