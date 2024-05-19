import { Knex } from 'knex';
import { CsvRow } from './csv-reader'; // Adjust the import path as needed
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

function castToUUID(value: string): string {
  if (uuidValidate(value)) {
    return value;
  } else {
    return uuidv4();
  }
}

export async function handleTransaction(knex: Knex, row: CsvRow) {
  // Cast UUIDs
  const uid = castToUUID(row.uid);
  const partner_uid = castToUUID(row.partner_uid);
  const order_uid = row.order_uid ? castToUUID(row.order_uid) : null;
  const booking_uid = row.booking_uid ? castToUUID(row.booking_uid) : null;

  await knex.transaction(async (trx) => {
    // Insert transaction
    await trx('transactions').insert({
      uid: uid,
      amount: row.amount,
      partner_uid: partner_uid,
      reason: row.reason,
      transacted_at: row.transacted_at ? new Date(row.transacted_at) : null,
      booking_uid: booking_uid,
      order_uid: order_uid,
      booking_completion: row.booking_completion ? new Date(row.booking_completion) : null,
      provider_pay: row.provider_pay || 0, // Ensure provider_pay is set to 0 if null
    });

    // Handle different reasons
    switch (row.reason) {
      case 'top_up':
      case 'invoice_payment':
        await processTopUp(trx, row);
        break;
      case 'booking_time_location_change':
      case 'booking_short_notice_reschedule':
        await processBookingTimeLocationChange(trx, row);
        break;
      case 'booking_refund':
        await processBookingRefund(trx, row);
        break;
      case 'booking_referral_creation':
        await processBookingReferralCreation(trx, row);
        break;
      case 'booking_package_change':
        await processBookingPackageChange(trx, row);
        break;
      case 'booking_extra':
        await processBookingExtra(trx, row);
        break;
      case 'booking_creation':
        await processBookingCreation(trx, row);
        break;
      case 'booking_cancellation':
        await processBookingCancellation(trx, row);
        break;
      default:
        await processDefault(trx, row);
        break;
    }
  });
}

async function processTopUp(trx: Knex.Transaction, row: CsvRow) {
  await trx('transaction_details').insert([
    {
      transaction_uid: row.uid,
      account_id: getAccountId('cash'),
      type: 'debit',
      amount: row.amount,
      created_at: row.transacted_at,
    },
    {
      transaction_uid: row.uid,
      account_id: getAccountId('enterprise_credits'),
      type: 'credit',
      amount: row.amount,
      created_at: row.transacted_at,
    },
  ]);
}

async function processBookingTimeLocationChange(trx: Knex.Transaction, row: CsvRow) {
  if (!row.booking_completion) {
    await trx('transaction_details').insert([
      {
        transaction_uid: row.uid,
        account_id: getAccountId('enterprise_credits'),
        type: 'debit',
        amount: -row.amount,
        created_at: row.transacted_at,
      },
      {
        transaction_uid: row.uid,
        account_id: getAccountId('accounts_payable_pending'),
        type: 'credit',
        amount: row.provider_pay,
        created_at: row.transacted_at,
      },
      {
        transaction_uid: row.uid,
        account_id: getAccountId('deferred_revenue'),
        type: 'credit',
        amount: -row.amount - (row.provider_pay? row.provider_pay: 0),
        created_at: row.transacted_at,
      },
    ]);
  } else {
    await trx('transaction_details').insert([
      {
        transaction_uid: row.uid,
        account_id: getAccountId('enterprise_credits'),
        type: 'debit',
        amount: -row.amount,
        created_at: row.transacted_at,
      },
      {
        transaction_uid: row.uid,
        account_id: getAccountId('revenue'),
        type: 'credit',
        amount: -row.amount - (row.provider_pay? row.provider_pay: 0),
        created_at: row.transacted_at,
      },
      {
        transaction_uid: row.uid,
        account_id: getAccountId('paid'),
        type: 'credit',
        amount: row.provider_pay,
        created_at: row.transacted_at,
      },
    ]);
  }
}

async function processBookingRefund(trx: Knex.Transaction, row: CsvRow) {
  await trx('transaction_details').insert([
    {
      transaction_uid: row.uid,
      account_id: getAccountId('enterprise_credits'),
      type: 'credit',
      amount: row.amount,
      created_at: row.transacted_at,
    },
    {
      transaction_uid: row.uid,
      account_id: getAccountId('revenue'),
      type: 'debit',
      amount: row.amount,
      created_at: row.transacted_at,
    },
  ]);
}

async function processBookingReferralCreation(trx: Knex.Transaction, row: CsvRow) {
  if (row.amount < 0) {
    await trx('transaction_details').insert([
      {
        transaction_uid: row.uid,
        account_id: getAccountId('enterprise_credits'),
        type: 'debit',
        amount: -row.amount,
        created_at: row.transacted_at,
      },
      {
        transaction_uid: row.uid,
        account_id: getAccountId('revenue'),
        type: 'credit',
        amount: -row.amount,
        created_at: row.transacted_at,
      },
    ]);
  }
}

async function processBookingPackageChange(trx: Knex.Transaction, row: CsvRow) {
  if (!row.booking_completion) {
    if (row.amount < 0) { // Assuming amount > 0 indicates an upgrade
      await trx('transaction_details').insert([
        {
          transaction_uid: row.uid,
          account_id: getAccountId('enterprise_credits'),
          type: 'debit',
          amount: -row.amount,
          created_at: row.transacted_at,
        },
        {
          transaction_uid: row.uid,
          account_id: getAccountId('deferred_revenue'),
          type: 'credit',
          amount: -row.amount- (row.provider_pay? row.provider_pay: 0),
          created_at: row.transacted_at,
        },
      ]);
    } else { // Downgrade
      await trx('transaction_details').insert([
        {
          transaction_uid: row.uid,
          account_id: getAccountId('enterprise_credits'),
          type: 'credit',
          amount: row.amount,
          created_at: row.transacted_at, 
        },
        {
          transaction_uid: row.uid,
          account_id: getAccountId('deferred_revenue'),
          type: 'debit',
          amount: row.amount,
          created_at: row.transacted_at, 
        },
      ]);
    }
  } else {
    if (row.amount < 0) { // Assuming amount < 0 indicates an upgrade
      await trx('transaction_details').insert([
        {
          transaction_uid: row.uid,
          account_id: getAccountId('enterprise_credits'),
          type: 'debit',
          amount: -row.amount,
          created_at: row.transacted_at,
        },
        {
          transaction_uid: row.uid,
          account_id: getAccountId('revenue'),
          type: 'credit',
          amount: -row.amount,
          created_at: row.transacted_at,
        },
      ]);
    } else { // Downgrade
      await trx('transaction_details').insert([
        {
          transaction_uid: row.uid,
          account_id: getAccountId('enterprise_credits'),
          type: 'credit',
          amount: row.amount,
          created_at: row.transacted_at, 
        },
        {
          transaction_uid: row.uid,
          account_id: getAccountId('revenue'),
          type: 'debit',
          amount: row.amount,
          created_at: row.transacted_at, 
        },
      ]);
    }
  }
}

async function processBookingExtra(trx: Knex.Transaction, row: CsvRow) {
  await trx('transaction_details').insert([
    {
      transaction_uid: row.uid,
      account_id: getAccountId('enterprise_credits'),
      type: 'debit',
      amount: -row.amount,
      created_at: row.transacted_at,
    },
    {
      transaction_uid: row.uid,
      account_id: getAccountId('deferred_revenue'),
      type: 'credit',
      amount: -row.amount- (row.provider_pay? row.provider_pay: 0),
      created_at: row.transacted_at,
    },
    {
      transaction_uid: row.uid,
      account_id: getAccountId('accounts_payable_pending'),
      type: 'credit',
      amount: row.provider_pay,
      created_at: row.transacted_at,
    },
  ]);
}

async function processBookingCreation(trx: Knex.Transaction, row: CsvRow) {
  await trx('transaction_details').insert([
    {
      transaction_uid: row.uid,
      account_id: getAccountId('enterprise_credits'),
      type: 'debit',
      amount: -row.amount,
      created_at: row.transacted_at,
    },
    {
      transaction_uid: row.uid,
      account_id: getAccountId('accounts_payable_pending'),
      type: 'credit',
      amount: row.provider_pay,
      created_at: row.transacted_at,
    },
    {
      transaction_uid: row.uid,
      account_id: getAccountId('deferred_revenue'),
      type: 'credit',
      amount: -row.amount- (row.provider_pay? row.provider_pay: 0),
      created_at: row.transacted_at,
    },
  ]);

  if (row.booking_completion) {
    await trx('transaction_details').insert([
      {
        transaction_uid: row.uid,
        account_id: getAccountId('accounts_payable_pending'),
        type: 'debit',
        amount: row.provider_pay,
        created_at: row.transacted_at,
      },
      {
        transaction_uid: row.uid,
        account_id: getAccountId('deferred_revenue'),
        type: 'debit',
        amount: -row.amount- (row.provider_pay? row.provider_pay: 0),
        created_at: row.transacted_at,
      },
      {
        transaction_uid: row.uid,
        account_id: getAccountId('paid'),
        type: 'credit',
        amount: row.provider_pay,
        created_at: row.transacted_at,
      },
      {
        transaction_uid: row.uid,
        account_id: getAccountId('revenue'),
        type: 'credit',
        amount: -row.amount- (row.provider_pay? row.provider_pay: 0),
        created_at: row.transacted_at,
      },
    ]);
  }
}

async function processBookingCancellation(trx: Knex.Transaction, row: CsvRow) {
  await trx('transaction_details').insert([
    {
      transaction_uid: row.uid,
      account_id: getAccountId('enterprise_credits'),
      type: 'debit',
      amount: row.amount,
      created_at: row.transacted_at,
    },
    {
      transaction_uid: row.uid,
      account_id: getAccountId('revenue'),
      type: 'credit',
      amount: row.amount,
      created_at: row.transacted_at,
    },
  ]);
}

async function processDefault(trx: Knex.Transaction, row: CsvRow) {
console.log(row.reason);
  await trx('transaction_details').insert([
    {
      transaction_uid: row.uid,
      account_id: getAccountId('non_handled_account'),
      type: 'credit',
      amount: row.amount,
      created_at: row.transacted_at,
    },
  ]);
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
