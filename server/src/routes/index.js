import { Router } from 'express';
import { env } from '../config/env.js';
import { requireEventAccess } from '../middleware/eventAccess.js';
import { globalApiRateLimit } from '../middleware/rateLimit.js';
import {
  createEventAccessToken,
  eventAccessRequired,
  isValidEventAccessCode,
  isValidEventAccessToken
} from '../services/eventAccessService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError, badRequest } from '../utils/httpError.js';
import { publicAnalysisMode } from '../utils/publicAiLabels.js';
import { adminRouter } from './adminRoutes.js';
import { analysisRouter } from './analysisRoutes.js';
import { authRouter } from './authRoutes.js';
import { caseRouter } from './caseRoutes.js';
import { dashboardRouter } from './dashboardRoutes.js';
import { reportRouter } from './reportRoutes.js';
import { zoneRouter } from './zoneRoutes.js';

export const apiRouter = Router();

apiRouter.use(globalApiRateLimit);

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'P.L.A.N.T.A. API',
    mode: publicAnalysisMode(env.analysisMode),
    eventAccessRequired: eventAccessRequired()
  });
});

apiRouter.get('/access/status', (req, res) => {
  const required = eventAccessRequired();

  res.json({
    required,
    verified: !required || isValidEventAccessToken(req.get('x-event-access-token'))
  });
});

apiRouter.post(
  '/access/verify',
  asyncHandler(async (req, res) => {
    if (!eventAccessRequired()) {
      res.json({
        required: false,
        verified: true,
        token: null
      });
      return;
    }

    if (!req.body?.code) {
      throw badRequest('Ingresa el codigo de acceso del evento.');
    }

    if (!isValidEventAccessCode(req.body.code)) {
      throw new HttpError(401, 'Codigo de acceso no valido.');
    }

    res.json({
      required: true,
      verified: true,
      ...createEventAccessToken()
    });
  })
);

apiRouter.use(requireEventAccess);

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/analysis', analysisRouter);
apiRouter.use('/cases', caseRouter);
apiRouter.use('/zones', zoneRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/admin', adminRouter);
