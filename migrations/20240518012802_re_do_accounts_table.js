/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // Drop the foreign key constraint from transaction_details
    await knex.schema.alterTable('transaction_details', (table) => {
      table.dropForeign('account_id');
    });
  
    // Drop the existing accounts table
    await knex.schema.dropTableIfExists('accounts');
    
    // Create the new accounts table with only id and name columns
    await knex.schema.createTable('accounts', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
    });
  
    // Repopulate the accounts table with necessary accounts
    await knex('accounts').insert([
      { id: 1, name: 'cash' },
      { id: 2, name: 'enterprise_credits' },
      { id: 3, name: 'accounts_payable_pending' },
      { id: 4, name: 'revenue' },
      { id: 5, name: 'pending_revenue' },
      { id: 6, name: 'paid' },
      { id: 7, name: 'non_handled_account' },
      { id: 8, name: 'deferred_revenue' }
    ]);
  
    // Recreate the foreign key constraint in transaction_details
    await knex.schema.alterTable('transaction_details', (table) => {
      table.foreign('account_id').references('accounts.id');
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    // Drop the foreign key constraint from transaction_details
    await knex.schema.alterTable('transaction_details', (table) => {
      table.dropForeign('account_id');
    });
  
    // Drop the accounts table
    await knex.schema.dropTableIfExists('accounts');
    
    // Recreate the accounts table with the original structure
    await knex.schema.createTable('accounts', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      // Add any additional columns if they were present before
    });
  
    // Repopulate the accounts table with necessary accounts
    await knex('accounts').insert([
      { id: 1, name: 'cash' },
      { id: 2, name: 'enterprise_credits' },
      { id: 3, name: 'accounts_payable_pending' },
      { id: 4, name: 'revenue' },
      { id: 5, name: 'pending_revenue' },
      { id: 6, name: 'paid' },
      { id: 7, name: 'non_handled_account' },
      { id: 8, name: 'deferred_revenue' }
    ]);
  
    // Recreate the foreign key constraint in transaction_details
    await knex.schema.alterTable('transaction_details', (table) => {
      table.foreign('account_id').references('accounts.id');
    });
  };
  