import Knex from 'knex';
import express from 'express';
import { readCSV, CsvRow } from './main/csv-reader';
import { handleTransaction } from './main/transactionHandler';
import { transactionDetails } from './main/transaction-details';
import { authenticateToken } from './middleware/auth';
import { getBalances } from './main/balances';
import { deleteData } from './main/deleteData';

const app = express();
const port = 3000;

export const configureApp = async () => {
  let deactivators: (() => void)[] = [];

  const knexConnection = await Knex({
    client: 'postgresql',
    useNullAsDefault: true,
    connection: process.env.DATA_BASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  });

  deactivators.push(() => knexConnection.destroy());

  return {
    app,
    knexConnection,
    deactivate: async () => {
      await Promise.all(deactivators.map((fn) => fn()));
    },
  };
};

app.post('/api/generate-transactions', authenticateToken, async (req, res) => {
  let i = 0;
  try {
    const { knexConnection } = await configureApp();
    const csvData = await readCSV(undefined);

    for (const row of csvData) {
      await handleTransaction(knexConnection, row);
    }

    res.status(200).send('CSV data processed successfully');
  } catch (error) {
    console.log(i);
    res.status(500).send(`Error processing CSV data: ${error}`);
  }
});

app.get('/api/balances-raw', authenticateToken, async (req, res) => {
  try {
    const { knexConnection } = await configureApp();
    const { fromDate, toDate } = req.query;
    const details = await transactionDetails(knexConnection, fromDate as string, toDate as string);
    res.status(200).json(details);
  } catch (error) {
    res.status(500).send(`Error retrieving transaction details: ${error}`);
  }
});

app.get('/api/balances', authenticateToken, async (req, res) => {
  try {
    const { knexConnection } = await configureApp();
    const { fromDate, toDate } = req.query;
    const csvFilePath = await getBalances(knexConnection, fromDate as string, toDate as string);
    res.download(csvFilePath);
  } catch (error) {
    res.status(500).send(`Error generating balances CSV: ${error}`);
  }
});

app.delete('/api/delete-data', authenticateToken, async (req, res) => {
  try {
    const { knexConnection } = await configureApp();
    await deleteData(knexConnection);
    res.status(200).send('Data deleted successfully');
  } catch (error) {
    res.status(500).send(`Error deleting data: ${error}`);
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

export default app;
