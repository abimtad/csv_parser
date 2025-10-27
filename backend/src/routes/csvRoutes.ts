import { Router } from "express";
import { uploadCsv } from "../controllers/csvController.js";
import upload from "../middleware/upload.js";
import { downloadCsv } from "../controllers/downloadController.js";
import { apiKeyAuth } from "../middleware/auth.js";

const router = Router();

router.post("/upload", apiKeyAuth, upload.single("file"), uploadCsv);
router.get("/download/:filename", apiKeyAuth, downloadCsv);

export default router;
