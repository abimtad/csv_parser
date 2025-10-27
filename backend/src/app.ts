import express, { Express, Request, Response, NextFunction } from "express";
import csvRoutes from "./routes/csvRoutes.js";
import ApiError from "./errors/apiError.js";

export const createApp = (): Express => {
  const app = express();

  // Routes
  app.use("/api", csvRoutes);

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Error middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
    // Basic error serializer
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // Optionally include stack in non-production
    const includeStack = process.env.NODE_ENV !== "production";
    // Ensure we never send errors as downloadable files
    if (res.getHeader("Content-Disposition")) {
      res.removeHeader("Content-Disposition");
    }
    res.type("application/json");
    res
      .status(statusCode)
      .json({ error: message, ...(includeStack && { stack: err.stack }) });
  });

  return app;
};

export default createApp;
