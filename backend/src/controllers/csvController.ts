import { Request, Response } from "express";
import { processCsv } from "../services/csvProcessor.js";

export const uploadCsv = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const outputFileName = await processCsv(req.file.path);
    const downloadLink = `${req.protocol}://${req.get(
      "host"
    )}/download/${outputFileName}`;
    res.json({
      message: "File processed successfully",
      downloadLink,
    });
  } catch (error) {
    res.status(500).send("Error processing file.");
  }
};
