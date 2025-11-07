const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const { filePath, outputFileName } = workerData;
const startTime = Date.now();
const salesData = {};

fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (row) => {
    const department = row["Department Name"];
    const sales = parseInt(row["Number of Sales"], 10);
    if (department && !Number.isNaN(sales)) {
      salesData[department] = (salesData[department] || 0) + sales;
    }
  })
  .on("end", () => {
    const departmentCount = Object.keys(salesData).length;
    const outputPath = path.join("processed", outputFileName);

    const outputData = [["Department Name", "Total Number of Sales"]];
    for (const department in salesData) {
      outputData.push([department, String(salesData[department])]);
    }
    const outputCsv = outputData.map((row) => row.join(",")).join("\n");

    fs.mkdir(path.dirname(outputPath), { recursive: true }, (mkErr) => {
      if (mkErr) throw mkErr;
      fs.writeFile(outputPath, outputCsv, (err) => {
        if (err) throw err;
        fs.unlink(filePath, () => {});
        const processingTimeMs = Date.now() - startTime;
        parentPort &&
          parentPort.postMessage({
            outputFileName,
            processingTimeMs,
            departmentCount,
          });
      });
    });
  })
  .on("error", (error) => {
    throw error;
  });
