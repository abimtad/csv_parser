import { Request, Response } from 'express';
import path from 'path';

export const downloadCsv = (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join('processed', filename);

  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found.');
    }
  });
};
