import { Router } from 'express';
import { env } from '../config/env.js';
import { adminRouter } from './adminRoutes.js';
import { analysisRouter } from './analysisRoutes.js';
import { authRouter } from './authRoutes.js';
import { caseRouter } from './caseRoutes.js';
import { dashboardRouter } from './dashboardRoutes.js';
import { reportRouter } from './reportRoutes.js';
import { zoneRouter } from './zoneRoutes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'P.L.A.N.T.A. API',
    mode: env.analysisMode
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/analysis', analysisRouter);
apiRouter.use('/cases', caseRouter);
apiRouter.use('/zones', zoneRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/admin', adminRouter);
