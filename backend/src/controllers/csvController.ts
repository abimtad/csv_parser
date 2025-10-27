import { Request, Response, NextFunction } from "express";
import { processCsv } from "../services/csvProcessor.js";
import ApiError from "../errors/apiError.js";

export const uploadCsv = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next(new ApiError(400, "No file uploaded."));
  }

  try {
    const { outputFileName, processingTimeMs, departmentCount } =
      await processCsv(req.file.path);
    const downloadLink = `${req.protocol}://${req.get(
      "host"
    )}/api/download/${outputFileName}`;
    res.json({
      message: "File processed successfully",
      downloadLink,
      processingTimeMs,
      departmentCount,
    });
  } catch (error) {
    next(new ApiError(500, "Error processing file."));
  }
};
