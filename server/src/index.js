import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsPath));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'P.L.A.N.T.A. API',
    mode: process.env.ANALYSIS_MODE || 'demo'
  });
});

app.listen(port, host, () => {
  console.log(`P.L.A.N.T.A. API disponible en http://${host}:${port}`);
});
