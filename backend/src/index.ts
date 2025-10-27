import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import csvRoutes from "./routes/csvRoutes.js";
import ApiError from "./errors/apiError.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use("/api", csvRoutes);

app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error(err); // For debugging
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ error: message });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
