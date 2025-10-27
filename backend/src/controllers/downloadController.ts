import { Request, Response, NextFunction } from "express";
import path from "path";
import ApiError from "../errors/apiError.js";

export const downloadCsv = (req: Request, res: Response, next: NextFunction) => {
  const { filename } = req.params;
  const filePath = path.resolve("processed", filename);

  res.download(filePath, (err) => {
    if (err) {
      return next(new ApiError(404, "File not found."));
    }
  });
};
