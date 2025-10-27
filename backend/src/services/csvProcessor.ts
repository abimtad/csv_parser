import fs from "fs";
import csv from "csv-parser";
import { v4 as uuidv4 } from "uuid";
import path from "path";

interface SalesData {
  [department: string]: number;
}

interface ProcessResult {
  outputFileName: string;
  processingTime: number;
  departmentCount: number;
}

export const processCsv = (filePath: string): Promise<ProcessResult> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const salesData: SalesData = {};
    const outputFileName = `${uuidv4()}.csv`;
    const outputPath = path.join("processed", outputFileName);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const department = row["Department Name"];
        const sales = parseInt(row["Number of Sales"], 10);

        if (department && !isNaN(sales)) {
          if (salesData[department]) {
            salesData[department] += sales;
          } else {
            salesData[department] = sales;
          }
        }
      })
      .on("end", () => {
        const departmentCount = Object.keys(salesData).length;
        const outputData = [["Department Name", "Total Number of Sales"]];
        for (const department in salesData) {
          outputData.push([department, salesData[department].toString()]);
        }

        const outputCsv = outputData.map((row) => row.join(",")).join("\n");

        fs.writeFile(outputPath, outputCsv, (err) => {
          if (err) {
            reject(err);
          } else {
            fs.unlink(filePath, (err) => {
              if (err) console.error("Error deleting temp file:", err);
            });
            const processingTimeMs = Date.now() - startTime;
            resolve({ outputFileName, processingTimeMs, departmentCount });
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
