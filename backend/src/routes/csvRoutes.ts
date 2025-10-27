import { Router } from 'express';
import { uploadCsv } from '../controllers/csvController.js';
import upload from '../middleware/upload.js';
import { downloadCsv } from '../controllers/downloadController.js';

const router = Router();

router.post('/upload', upload.single('file'), uploadCsv);
router.get('/download/:filename', downloadCsv);

export default router;
