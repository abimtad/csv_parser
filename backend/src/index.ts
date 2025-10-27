import express, { Express } from 'express';
import dotenv from 'dotenv';
import csvRoutes from './routes/csvRoutes.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use('/api', csvRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
