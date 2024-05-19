import request from 'supertest';
import app, { configureApp } from '../../../src/index';
import { Knex } from 'knex';
import { Server } from 'http';
import knexConfig from '../../../src/knexfile';
import path from 'path';

const knex = require('knex')(knexConfig.test);

let server: Server;

beforeAll(async () => {
  // Run migrations on the test database
  await knex.migrate.latest();

  const configuredApp = await configureApp();
  server = configuredApp.app.listen(3001, () => {
    console.log(`Test server running on port 3001`);
  });
});

afterAll(async () => {
  await knex.destroy();
  if (server) {
    server.close();
  }
});

describe('E2E Tests', () => {
  it('should process CSV data successfully for multiple scenarios', async () => {
    // Path to the mock CSV file
    const mockCsvFilePath = path.join(__dirname, '../../../test-data/test-data.csv');

    // Mock the readCSV function to return the data from the mock CSV file
    jest.mock('../../../src/main/csv-reader', () => ({
      readCSV: jest.fn(() => require('../../../src/main/csv-reader').readCSV(mockCsvFilePath)),
    }));

    // Process CSV data
    const response = await request(server).post('/api/generate-transactions')
      .set('Authorization', 'Bearer this-is-not-my-best-token-i-swear');
    expect(response.status).toBe(200);
    expect(response.text).toBe('CSV data processed successfully');

    // Verify the transactions table for booking_creation
    const transaction1 = await knex('transactions').where({ uid: '87ca7b8e-8669-4f5d-aa9d-35b90ccd9cbe' }).first();
    expect(transaction1).toMatchObject({
      uid: '87ca7b8e-8669-4f5d-aa9d-35b90ccd9cbe',
      amount: -14900,
      partner_uid: '6e150b95-f063-40fe-abdc-49e45fe529c6',
      reason: 'booking_creation',
      booking_uid: '4bffe307-26a0-416e-a61f-7d2fb311b252',
      provider_pay: 11920,
    });

    // Verify the transaction_details table for booking_creation
    const transactionDetails1 = await knex('transaction_details').where({ transaction_uid: '87ca7b8e-8669-4f5d-aa9d-35b90ccd9cbe' }).first();
    expect(transactionDetails1).toMatchObject({
      transaction_uid: '87ca7b8e-8669-4f5d-aa9d-35b90ccd9cbe',
      account_id: 1, 
      amount: -14900,
      type: 'credit',
    });

    // Verify the transactions table for booking_short_notice_reschedule
    const transaction2 = await knex('transactions').where({ uid: '9ac4a67e-b969-4351-86ba-c5d3a1bf4ff7' }).first();
    expect(transaction2).toMatchObject({
      uid: '9ac4a67e-b969-4351-86ba-c5d3a1bf4ff7',
      amount: -14900,
      partner_uid: '6e150b95-f063-40fe-abdc-49e45fe529c6',
      reason: 'booking_short_notice_reschedule',
      booking_uid: '578479ec-2b2a-4a6a-b740-9edaaa170c3f',
      provider_pay: 12935,
    });

    // Verify the transaction_details table for booking_short_notice_reschedule
    const transactionDetails2 = await knex('transaction_details').where({ transaction_uid: '9ac4a67e-b969-4351-86ba-c5d3a1bf4ff7' }).first();
    expect(transactionDetails2).toMatchObject({
      transaction_uid: '9ac4a67e-b969-4351-86ba-c5d3a1bf4ff7',
      account_id: 1, 
      amount: -14900,
      type: 'credit',
    });

    // Verify the transactions table for booking_extra
    const transaction3 = await knex('transactions').where({ uid: 'd1524271-4d29-45c8-a710-6a217bdf8d04' }).first();
    expect(transaction3).toMatchObject({
      uid: 'd1524271-4d29-45c8-a710-6a217bdf8d04',
      amount: -5880,
      partner_uid: '6e150b95-f063-40fe-abdc-49e45fe529c6',
      reason: 'booking_extra',
      booking_uid: '9bacfafb-9f0f-4e45-b15d-e7673a127edd',
      booking_completion: '2019-07-01 03:40:01+00',
      provider_pay: 9520,
    });

    // Verify the transaction_details table for booking_extra
    const transactionDetails3 = await knex('transaction_details').where({ transaction_uid: 'd1524271-4d29-45c8-a710-6a217bdf8d04' }).first();
    expect(transactionDetails3).toMatchObject({
      transaction_uid: 'd1524271-4d29-45c8-a710-6a217bdf8d04',
      account_id: 1, 
      amount: -5880,
      type: 'credit',
    });

    // Verify the transactions table for top_up
    const transaction4 = await knex('transactions').where({ uid: 'baef32ef-d08f-44b5-8e4f-035101444e48' }).first();
    expect(transaction4).toMatchObject({
      uid: 'baef32ef-d08f-44b5-8e4f-035101444e48',
      amount: 750000,
      partner_uid: '9252a5d9-daf9-46ca-aa98-a264592e116f',
      reason: 'top_up',
      order_uid: '858d652a-0d9b-484a-b883-535957585f06',
    });

    // Verify the transaction_details table for top_up
    const transactionDetails4 = await knex('transaction_details').where({ transaction_uid: 'baef32ef-d08f-44b5-8e4f-035101444e48' }).first();
    expect(transactionDetails4).toMatchObject({
      transaction_uid: 'baef32ef-d08f-44b5-8e4f-035101444e48',
      account_id: 1, 
      amount: 750000,
      type: 'debit',
    });

    // Verify the transactions table for booking_cancellation
    const transaction5 = await knex('transactions').where({ uid: 'c5122d37-39a9-4fa7-91f6-edbd42208a5a' }).first();
    expect(transaction5).toMatchObject({
      uid: 'c5122d37-39a9-4fa7-91f6-edbd42208a5a',
      amount: 24900,
      partner_uid: 'd5ec940b-564d-4675-8550-fcbb63078fde',
      reason: 'booking_cancellation',
      booking_uid: '178bb75e-0c68-4cc6-ab25-59da293fa1d4',
      provider_pay: 16185,
    });

    // Verify the transaction_details table for booking_cancellation
    const transactionDetails5 = await knex('transaction_details').where({ transaction_uid: 'c5122d37-39a9-4fa7-91f6-edbd42208a5a' }).first();
    expect(transactionDetails5).toMatchObject({
      transaction_uid: 'c5122d37-39a9-4fa7-91f6-edbd42208a5a',
      account_id: 1, 
      amount: 24900,
      type: 'credit',
    });
  });

  it('should return transaction details within date range', async () => {
    const response = await request(server)
      .get('/api/balances-raw')
      .set('Authorization', 'Bearer this-is-not-my-best-token-i-swear')
      .query({ fromDate: '2023-01-01', toDate: '2023-12-31' });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('should generate balances CSV within date range with correct content-type', async () => {
    const response = await request(server)
      .get('/api/balances')
      .set('Authorization', 'Bearer this-is-not-my-best-token-i-swear')
      .query({ fromDate: '2023-01-01', toDate: '2023-12-31' });
    expect(response.status).toBe(200);
    expect(response.header['content-type']).toBe('text/csv; charset=UTF-8');
  });
});

afterEach(async () => {
  // Clean up the database after each test
  await knex.raw('TRUNCATE TABLE transactions, transaction_details RESTART IDENTITY CASCADE');
});
