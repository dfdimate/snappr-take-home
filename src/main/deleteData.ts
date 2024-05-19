import { Knex } from 'knex';

export const deleteData = async (knex: Knex): Promise<void> => {
  await knex.transaction(async (trx) => {
    await trx('transaction_details').del();
    await trx('transactions').del();
  });
};
