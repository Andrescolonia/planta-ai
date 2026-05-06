import { Router } from 'express';
import fs from 'node:fs/promises';
import { all, get } from '../database/connection.js';
import { analysisQuota } from '../middleware/analysisQuota.js';
import { analysisRateLimit } from '../middleware/rateLimit.js';
import { imageUpload } from '../middleware/upload.js';
import { analysisService } from '../services/analysisService.js';
import { storeUploadedImage } from '../services/storageService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest } from '../utils/httpError.js';

export const analysisRouter = Router();

async function removeUploadedFile(file) {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch {
    // La limpieza de archivos temporales no debe ocultar el error principal.
  }
}

analysisRouter.post(
  '/analyze',
  analysisRateLimit,
  analysisQuota,
  imageUpload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw badRequest('Selecciona una imagen para analizar.');
    }

    const zoneId = req.body.zoneId ? Number(req.body.zoneId) : null;
    const location = String(req.body.location || '').trim();

    if (!zoneId) {
      await removeUploadedFile(req.file);
      throw badRequest('Selecciona una zona verde para asociar el analisis.');
    }

    if (location.length > 160) {
      await removeUploadedFile(req.file);
      throw badRequest('La ubicacion especifica no debe superar 160 caracteres.');
    }

    if (zoneId) {
      const zone = await get('SELECT id FROM zones WHERE id = ?', [zoneId]);
      if (!zone) {
        await removeUploadedFile(req.file);
        throw badRequest('La zona seleccionada no existe.');
      }
    }

    const recommendations = await all('SELECT * FROM recommendations ORDER BY sort_order');
    let result;

    try {
      result = await analysisService.analyze({
        file: req.file,
        zoneId,
        recommendations
      });
    } catch (error) {
      await removeUploadedFile(req.file);
      throw error;
    }

    let storedImage;

    try {
      storedImage = await storeUploadedImage(req.file);
    } catch (error) {
      await removeUploadedFile(req.file);
      throw error;
    }

    res.json({
      message:
        result.mode === 'openai'
          ? 'Analisis con OpenAI completado.'
          : 'Analisis demo completado.',
      uploadedImage: {
        path: storedImage.path,
        url: storedImage.url,
        provider: storedImage.provider,
        key: storedImage.key,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      },
      result,
      suggestedCase: {
        zoneId,
        location: location || 'Ubicacion pendiente por confirmar',
        imagePath: storedImage.path,
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
