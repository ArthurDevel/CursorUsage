import { parse } from 'papaparse';
import type { UsageEvent } from '../types';

export const parseCSV = (file: File): Promise<UsageEvent[]> => {
  return new Promise((resolve, reject) => {
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const parsedData: UsageEvent[] = results.data.map((row: any) => ({
          date: row['Date'],
          kind: row['Kind'],
          model: row['Model'],
          maxMode: row['Max Mode'],
          inputWithCache: parseInt(row['Input (w/ Cache Write)'] || '0', 10),
          inputWithoutCache: parseInt(row['Input (w/o Cache Write)'] || '0', 10),
          cacheRead: parseInt(row['Cache Read'] || '0', 10),
          outputTokens: parseInt(row['Output Tokens'] || '0', 10),
          totalTokens: parseInt(row['Total Tokens'] || '0', 10),
          cost: parseFloat(row['Cost'] || '0')
        })).filter((item: any) => item.date && !isNaN(item.cost)); // Basic validation
        
        resolve(parsedData);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};
