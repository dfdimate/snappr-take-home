import { Knex } from 'knex';

export async function transactionDetails(knex: Knex, fromDate?: string, toDate?: string) {
  let query = knex('transaction_details')
    .join('accounts', 'transaction_details.account_id', '=', 'accounts.id')
    .select(
      'transaction_details.transaction_uid',
      'transaction_details.type',
      'transaction_details.amount',
      'accounts.name as account_name',
      'transaction_details.created_at',
    );

  if (fromDate) {
    query = query.where('transaction_details.created_at', '>=', fromDate);
  }
  if (toDate) {
    query = query.where('transaction_details.created_at', '<=', toDate);
  }

  return await query;
}
