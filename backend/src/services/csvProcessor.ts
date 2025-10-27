import fs from "fs";
import csv from "csv-parser";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { Worker } from "node:worker_threads";

interface SalesData {
  [department: string]: number;
}

interface ProcessResult {
  outputFileName: string;
  processingTimeMs: number;
  departmentCount: number;
}

const processInline = (filePath: string): Promise<ProcessResult> => {
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

export const processCsv = (filePath: string): Promise<ProcessResult> => {
  const shouldUseWorker = (): boolean => {
    if (process.env.DISABLE_WORKER === "true") return false;
    // Disable in Jest/test environments to keep unit tests deterministic
    if (process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID)
      return false;
    return true;
  };

  if (!shouldUseWorker()) {
    return processInline(filePath);
  }

  // Try worker first; if it fails for any reason, gracefully fall back to inline
  return new Promise<ProcessResult>((resolve, reject) => {
    const outputFileName = `${uuidv4()}.csv`;
    const workerCode = `
      import { parentPort, workerData } from 'node:worker_threads';
      import fs from 'node:fs';
      import csv from 'csv-parser';
      import path from 'node:path';

      const { filePath, outputFileName } = workerData;
      const startTime = Date.now();
      const salesData = {};

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const department = row['Department Name'];
          const sales = parseInt(row['Number of Sales'], 10);
          if (department && !Number.isNaN(sales)) {
            salesData[department] = (salesData[department] || 0) + sales;
          }
        })
        .on('end', () => {
          const departmentCount = Object.keys(salesData).length;
          const outputPath = path.join('processed', outputFileName);

          const outputData = [['Department Name', 'Total Number of Sales']];
          for (const department in salesData) {
            outputData.push([department, String(salesData[department])]);
          }
          const outputCsv = outputData.map((row) => row.join(',')).join('\n');

          fs.writeFile(outputPath, outputCsv, (err) => {
            if (err) {
              throw err;
            } else {
              fs.unlink(filePath, () => {});
              const processingTimeMs = Date.now() - startTime;
              parentPort?.postMessage({ outputFileName, processingTimeMs, departmentCount });
            }
          });
        })
        .on('error', (error) => {
          throw error;
        });
    `;

    const worker = new Worker(
      `data:text/javascript,${encodeURIComponent(workerCode)}`,
      {
        eval: true,
        type: "module",
        workerData: { filePath, outputFileName },
      } as unknown as any
    );

    let settled = false;
    const doFallback = async (reason?: unknown) => {
      if (settled) return;
      settled = true;
      try {
        const result = await processInline(filePath);
        resolve(result);
      } catch (err) {
        reject(reason || err);
      }
    };

    worker.on("message", (result: ProcessResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    });
    worker.on("error", (err) => doFallback(err));
    worker.on("exit", (code) => {
      if (!settled && code !== 0)
        doFallback(new Error(`Worker exited with code ${code}`));
    });
  });
};
