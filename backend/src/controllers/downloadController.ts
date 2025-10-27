import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import ApiError from "../errors/apiError.js";

export const downloadCsv = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filename } = req.params;
    // Prevent path traversal
    const safeName = path.basename(filename);
    if (safeName !== filename) {
      return next(new ApiError(400, "Invalid filename."));
    }

    const filePath = path.resolve("processed", safeName);

    // Check existence first to avoid setting attachment headers on error
    await fs.promises.access(filePath, fs.constants.R_OK).catch(() => {
      throw new ApiError(404, "File not found.");
    });

    // Stream file and set explicit CSV content type
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    // Also provide content-disposition so browsers download on success only
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${safeName}\"`
    );

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => next(new ApiError(500, "Error reading file.")));
    stream.pipe(res);
  } catch (err) {
    return next(err as ApiError);
  }
};
