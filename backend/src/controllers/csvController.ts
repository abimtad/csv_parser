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
    // Log the original error for debugging (tests and runtime will see this
    // in stdout/stderr). The error is still passed to the error middleware
    // which serializes a safe message to the client.
    console.error("uploadCsv caught error:", error);
    const message = error instanceof Error ? error.message : String(error);
    next(new ApiError(500, `Error processing file: ${message}`));
  }
};
