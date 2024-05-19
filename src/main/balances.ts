import { Knex } from 'knex';
import { createObjectCsvWriter } from 'csv-writer';
import moment from 'moment';

interface PAndLResult {
  month: string;
  sum: number;
}

interface BalanceSheetResult {
  account_id: number;
  sum: number;
}

interface PAndL {
  [month: string]: { totalRevenue: number; totalPaid: number };
}

interface Record {
  item: string;
  [key: string]: string | number;
}

export async function getBalances(knex: Knex, fromDate?: string, toDate?: string) {
  // Define date range for query
  const dateRangeQuery = (queryBuilder: Knex.QueryBuilder) => {
    if (fromDate) {
      queryBuilder.where('transactions.transacted_at', '>=', fromDate);
    }
    if (toDate) {
      queryBuilder.where('transactions.transacted_at', '<=', toDate);
    }
  };

  // Calculate P&L per month (strictly for transactions in that month)
  const revenueResult: PAndLResult[] = await knex('transaction_details')
    .join('transactions', 'transaction_details.transaction_uid', '=', 'transactions.uid')
    .where('transaction_details.account_id', getAccountId('revenue'))
    .modify(dateRangeQuery)
    .select(knex.raw(`TO_CHAR(DATE_TRUNC('month', transactions.transacted_at), 'YYYY-MM') as month`))
    .sum(knex.raw(`CASE WHEN transaction_details.type = 'credit' THEN transaction_details.amount ELSE -transaction_details.amount END`))
    .groupBy(knex.raw(`TO_CHAR(DATE_TRUNC('month', transactions.transacted_at), 'YYYY-MM')`));

  const paidResult: PAndLResult[] = await knex('transaction_details')
    .join('transactions', 'transaction_details.transaction_uid', '=', 'transactions.uid')
    .where('transaction_details.account_id', getAccountId('paid'))
    .modify(dateRangeQuery)
    .select(knex.raw(`TO_CHAR(DATE_TRUNC('month', transactions.transacted_at), 'YYYY-MM') as month`))
    .sum(knex.raw(`CASE WHEN transaction_details.type = 'credit' THEN transaction_details.amount ELSE -transaction_details.amount END`))
    .groupBy(knex.raw(`TO_CHAR(DATE_TRUNC('month', transactions.transacted_at), 'YYYY-MM')`));

  // Combine results per month for P&L
  const pAndL: PAndL = {};
  revenueResult.forEach(({ month, sum }) => {
    if (!pAndL[month]) {
      pAndL[month] = { totalRevenue: 0, totalPaid: 0 };
    }
    pAndL[month].totalRevenue = +sum || 0;
  });
  paidResult.forEach(({ month, sum }) => {
    if (!pAndL[month]) {
      pAndL[month] = { totalRevenue: 0, totalPaid: 0 };
    }
    pAndL[month].totalPaid = +sum || 0;
  });

  // Calculate Balance Sheet Items up to the end of each month
  const balanceSheetItems: { [month: string]: { [accountName: string]: number } } = {};
  const startDate = moment(fromDate);
  const endDate = moment(toDate).endOf('month');
  const months: string[] = [];

  while (startDate.isBefore(endDate) || startDate.isSame(endDate)) {
    const currentMonth = startDate.format('YYYY-MM');
    months.push(currentMonth);

    const monthEnd = startDate.endOf('month').format('YYYY-MM-DD');
    const balanceSheetResult: BalanceSheetResult[] = await knex('transaction_details')
      .join('transactions', 'transaction_details.transaction_uid', '=', 'transactions.uid')
      .where('transactions.transacted_at', '<=', monthEnd)
      .select('transaction_details.account_id')
      .sum(knex.raw(`CASE WHEN transaction_details.type = 'credit' THEN transaction_details.amount ELSE -transaction_details.amount END`))
      .groupBy('transaction_details.account_id');

    balanceSheetItems[currentMonth] = {};
    for (const item of balanceSheetResult) {
      const accountName = await getAccountNameById(knex, item.account_id);
      balanceSheetItems[currentMonth][accountName] = item.sum;
    }

    startDate.add(1, 'month').startOf('month');
  }

  // Write CSV
  const csvWriter = createObjectCsvWriter({
    path: './balances.csv',
    header: [
      { id: 'item', title: 'Item' },
      ...months.map(month => ({ id: month, title: month })),
    ],
  });

  const records: Record[] = [];

  // Add P&L items to the records
  const gmvRow: Record = { item: 'P_L-GMV' };
  const paidRow: Record = { item: 'P_L-Paid' };
  const revenueRow: Record = { item: 'P_L-Revenue' };

  months.forEach(month => {
    const pAndLData = pAndL[month] || { totalRevenue: 0, totalPaid: 0 };
    const gmv = pAndLData.totalRevenue + pAndLData.totalPaid;
    gmvRow[month] = gmv;
    paidRow[month] = pAndLData.totalPaid;
    revenueRow[month] = pAndLData.totalRevenue;
  });

  records.push(gmvRow, paidRow, revenueRow);

  // Add Balance Sheet items to the records
  const balanceSheetAccounts = new Set<string>();
  Object.values(balanceSheetItems).forEach(items => {
    Object.keys(items).forEach(account => balanceSheetAccounts.add(account));
  });

  balanceSheetAccounts.forEach(accountName => {
    const row: Record = { item: `B_S-${accountName}` };
    months.forEach(month => {
      row[month] = balanceSheetItems[month]?.[accountName] || 0;
    });
    records.push(row);
  });

  await csvWriter.writeRecords(records);

  return './balances.csv';
}

async function getAccountNameById(knex: Knex, accountId: number): Promise<string> {
  const result = await knex('accounts')
    .select('name')
    .where('id', accountId)
    .first();
  return result.name;
}

function getAccountId(accountName: string): number {
  const accountMap: { [key: string]: number } = {
    'cash': 1,
    'enterprise_credits': 2,
    'accounts_payable_pending': 3,
    'revenue': 4,
    'pending_revenue': 5,
    'paid': 6,
    'non_handled_account': 7,
    'deferred_revenue': 8
  };
  return accountMap[accountName];
}
