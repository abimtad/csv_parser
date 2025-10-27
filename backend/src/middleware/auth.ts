import { Request, Response, NextFunction } from "express";
import ApiError from "../errors/apiError.js";

export function apiKeyAuth(req: Request, _res: Response, next: NextFunction) {
  const presented = req.header("x-api-key");

  // Support multiple keys via comma-separated env var, plus single API_KEY for convenience
  const keysEnv = process.env.API_KEYS || "";
  const list = keysEnv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (process.env.API_KEY) list.push(process.env.API_KEY);

  const allowed = new Set(list);

  if (allowed.size === 0) {
    return next(new ApiError(401, "API key not configured"));
  }

  if (!presented || !allowed.has(presented)) {
    return next(new ApiError(401, "Unauthorized"));
  }

  return next();
}
