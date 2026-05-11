const { resizeImage } = require('./image.service');
const { validateResizeParams } = require('./image.validator');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

/**
 * POST /image/resize
 * Body (multipart/form-data):
 *   - image        : file (JPG | PNG | WebP, max 10MB)
 *   - width        : number (1–8000) — ít nhất 1 trong 2
 *   - height       : number (1–8000) — ít nhất 1 trong 2
 *   - format       : 'jpeg' | 'png' | 'webp'  (default: jpeg)
 *   - fit          : 'cover'|'contain'|'fill'|'inside'|'outside'  (default: inside)
 *   - quality      : 10–100  (default: 90)
 */
const resize = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Vui lòng upload ảnh (field "image").', 400));
  }

  // Parse params — body values từ multipart là string, cần convert
  const rawParams = {
    width: req.body.width ? Number(req.body.width) : undefined,
    height: req.body.height ? Number(req.body.height) : undefined,
    format: req.body.format,
    fit: req.body.fit,
    quality: req.body.quality ? Number(req.body.quality) : undefined,
    maintainAspect: req.body.maintainAspect,
  };

  // Loại bỏ undefined để Joi không phàn nàn
  Object.keys(rawParams).forEach((k) => rawParams[k] === undefined && delete rawParams[k]);

  const params = validateResizeParams(rawParams);

  const { buffer, mimeType, ext, info } = await resizeImage(req.file.buffer, params);

  // Tên file kết quả
  const originalName = (req.file.originalname || 'image').replace(/\.[^.]+$/, '');
  const suffix = `${info.outputWidth}x${info.outputHeight}`;
  const filename = `${originalName}-${suffix}.${ext}`;

  res.set({
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length,
    'X-Image-Original-Width': info.originalWidth,
    'X-Image-Original-Height': info.originalHeight,
    'X-Image-Output-Width': info.outputWidth,
    'X-Image-Output-Height': info.outputHeight,
  });

  return res.send(buffer);
});

module.exports = { resize };
