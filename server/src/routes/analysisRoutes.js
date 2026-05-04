import { Router } from 'express';
import { all, get } from '../database/connection.js';
import { imageUpload, buildPublicImagePath } from '../middleware/upload.js';
import { analysisService } from '../services/analysisService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest } from '../utils/httpError.js';

export const analysisRouter = Router();

analysisRouter.post(
  '/analyze',
  imageUpload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw badRequest('Selecciona una imagen para analizar.');
    }

    const zoneId = req.body.zoneId ? Number(req.body.zoneId) : null;

    if (zoneId) {
      const zone = await get('SELECT id FROM zones WHERE id = ?', [zoneId]);
      if (!zone) {
        throw badRequest('La zona seleccionada no existe.');
      }
    }

    const recommendations = await all('SELECT * FROM recommendations ORDER BY sort_order');
    const result = await analysisService.analyze({
      file: req.file,
      zoneId,
      recommendations
    });
    const imagePath = buildPublicImagePath(req.file.filename);

    res.json({
      message: 'Analisis demo completado.',
      uploadedImage: {
        path: imagePath,
        url: imagePath,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      },
      result,
      suggestedCase: {
        zoneId,
        location: req.body.location || 'Ubicacion pendiente por confirmar',
        imagePath,
        imageFilename: req.file.filename,
        diagnosticState: result.diagnosticState,
        confidence: result.confidence,
        riskLevel: result.riskLevel,
        irrigationRecommendation: result.irrigationRecommendation,
        observations: result.observations,
        priority: result.priority,
        analysisMode: result.mode
      }
    });
  })
);
