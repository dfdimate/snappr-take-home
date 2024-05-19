import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export interface CsvRow {
  uid: string;
  amount: number;
  partner_uid: string;
  reason: string;
  transacted_at: string | null; 
  booking_uid: string;
  order_uid: string;
  booking_completion: string | null; 
  provider_pay?: number; 
}

const csvFilePath = './data.csv';

// Function to read and process the CSV file
export function readCSV(path: string|undefined): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];

    fs.createReadStream(path? path: csvFilePath)
      .pipe(csv())
      .on('data', (data: Partial<CsvRow>) => {
        // Validate UUIDs and set provider_pay to 0 if null
        const row: CsvRow = {
          uid: data.uid ? (uuidValidate(data.uid) ? data.uid : uuidv4()) : uuidv4(),
          amount: data.amount || 0,
          partner_uid: data.partner_uid ? (uuidValidate(data.partner_uid) ? data.partner_uid : uuidv4()) : uuidv4(),
          reason: data.reason || '',
          transacted_at: data.transacted_at || null,
          booking_uid: data.booking_uid || '',
          order_uid: data.order_uid || '',
          booking_completion: data.booking_completion || null,
          provider_pay: data.provider_pay !== undefined ? data.provider_pay : 0,
        };

        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
