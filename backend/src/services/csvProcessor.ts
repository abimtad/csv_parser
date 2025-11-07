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
    // Use an external worker file instead of eval'd source. The worker is
    // implemented as CommonJS (csvWorker.cjs) so it works across module
    // / non-module runtimes and avoids embedding/escaping source at runtime.
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

    // Resolve the worker file URL relative to this module
    const workerFile = new URL('./csvWorker.cjs', import.meta.url);
    let worker: Worker | undefined;
    try {
      // Create worker from file (CommonJS .cjs) — do not use eval.
      worker = new Worker(workerFile, {
        workerData: { filePath, outputFileName },
      } as unknown as any);
    } catch (err) {
      // Synchronous failure creating the worker — fall back to inline.
      console.error('Worker constructor threw:', err);
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
