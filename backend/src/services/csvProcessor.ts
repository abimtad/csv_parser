import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

interface SalesData {
  [department: string]: number;
}

export const processCsv = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salesData: SalesData = {};
    const outputFileName = `${uuidv4()}.csv`;
    const outputPath = path.join('processed', outputFileName);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const department = row['Department Name'];
        const sales = parseInt(row['Number of Sales'], 10);

        if (department && !isNaN(sales)) {
          if (salesData[department]) {
            salesData[department] += sales;
          } else {
            salesData[department] = sales;
          }
        }
      })
      .on('end', () => {
        const outputData = [['Department Name', 'Total Number of Sales']];
        for (const department in salesData) {
          outputData.push([department, salesData[department].toString()]);
        }

        const outputCsv = outputData.map((row) => row.join(',')).join('\n');

        fs.writeFile(outputPath, outputCsv, (err) => {
          if (err) {
            reject(err);
          } else {
            fs.unlink(filePath, (err) => {
              if (err) console.error('Error deleting temp file:', err);
            });
            resolve(outputFileName);
          }
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
