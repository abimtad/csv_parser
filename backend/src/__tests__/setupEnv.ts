import dotenv from "dotenv";
import path from "path";

// Load test-specific env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
