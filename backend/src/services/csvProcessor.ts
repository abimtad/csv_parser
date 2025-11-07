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
        // Ensure output directory exists
        fs.mkdir(path.dirname(outputPath), { recursive: true }, (mkErr) => {
          if (mkErr) return reject(mkErr);
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
        });
      })
      .on("error", (error) => {
        console.error("processInline stream error:", error);
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
    // Use CommonJS style requires inside the worker source to avoid ESM
    // / CommonJS mismatches when the worker is evaluated. Some runtime
    // environments (and older Node/Jest setups) will treat eval'd code as
    // script (not module) which makes top-level `import` invalid and throws
    // "Cannot use import statement outside a module". Using `require`
    // keeps the worker compatible with both module and non-module hosts.
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');
      const fs = require('fs');
      const csv = require('csv-parser');
      const path = require('path');

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

          // Ensure output directory exists
          fs.mkdir(path.dirname(outputPath), { recursive: true }, (mkErr) => {
            if (mkErr) throw mkErr;
            fs.writeFile(outputPath, outputCsv, (err) => {
              if (err) {
                throw err;
              } else {
                fs.unlink(filePath, () => {});
                const processingTimeMs = Date.now() - startTime;
                parentPort && parentPort.postMessage({ outputFileName, processingTimeMs, departmentCount });
              }
            });
          });
        })
        .on('error', (error) => {
          throw error;
        });
    `;

    // When using eval: true we must pass the raw JS source string to the
    // Worker constructor. Previously the code was passed as a data: URI
    // created with encodeURIComponent which produced percent-encoded
    // sequences (e.g. "%0A") — those percent signs are valid in a URL
    // but not valid JavaScript, causing the "Unexpected token '%'" error.
    // Evaluate the workerCode as a script (CommonJS style). Do not set
    // `type: 'module'` so the eval'd source will run under CommonJS semantics
    // which matches the `require` calls above.
    let settled = false;

    const doFallback = async (reason?: unknown) => {
      if (settled) return;
      settled = true;
      try {
        const result = await processInline(filePath);
        resolve(result);
      } catch (err) {
        console.error("Fallback processing failed:", reason || err);
        reject(reason || err);
      }
    };

    // Worker construction can throw synchronously in certain environments
    // (for example, when eval'd code contains unsupported syntax). Wrap
    // creation in try/catch and fall back to inline processing if it fails.
    let worker: Worker | undefined;
    try {
      worker = new Worker(workerCode, {
        eval: true,
        workerData: { filePath, outputFileName },
      } as unknown as any);
    } catch (err) {
      // Synchronous failure creating the worker — fall back to inline.
      console.error("Worker constructor threw:", err);
      doFallback(err);
      return;
    }

    worker.on("message", (result: ProcessResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    });
    worker.on("error", (err) => {
      console.error("Worker emitted error:", err);
      doFallback(err);
    });
    worker.on("exit", (code) => {
      if (!settled && code !== 0)
        doFallback(new Error(`Worker exited with code ${code}`));
    });
  });
};
