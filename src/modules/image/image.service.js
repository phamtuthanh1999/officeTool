const sharp = require('sharp');
const AppError = require('../../utils/AppError');

/**
 * Resize ảnh từ buffer.
 *
 * @param {Buffer} inputBuffer  - Buffer ảnh gốc
 * @param {object} options
 * @param {number} [options.width]        - Chiều rộng đích (px)
 * @param {number} [options.height]       - Chiều cao đích (px)
 * @param {string} [options.format]       - 'jpeg' | 'png' | 'webp'  (default: 'jpeg')
 * @param {string} [options.fit]          - sharp fit mode  (default: 'inside')
 * @param {number} [options.quality]      - 10-100 (default: 90)
 * @returns {{ buffer: Buffer, mimeType: string, ext: string, info: object }}
 */
async function resizeImage(inputBuffer, { width, height, format = 'jpeg', fit = 'inside', quality = 90 }) {
  // Đọc metadata ảnh gốc để validate
  let metadata;
  try {
    metadata = await sharp(inputBuffer).metadata();
  } catch {
    throw new AppError('File không phải là ảnh hợp lệ hoặc bị hỏng.', 400);
  }

  if (!metadata.width || !metadata.height) {
    throw new AppError('Không thể đọc kích thước ảnh gốc.', 400);
  }

  const resizeOptions = {
    fit,
    withoutEnlargement: false,
  };
  if (width) resizeOptions.width = width;
  if (height) resizeOptions.height = height;

  let pipeline = sharp(inputBuffer).resize(resizeOptions);

  const mimeMap = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const extMap = { jpeg: 'jpg', png: 'png', webp: 'webp' };

  switch (format) {
    case 'png':
      pipeline = pipeline.png({ compressionLevel: Math.round((100 - quality) / 11) });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    default:
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  const { data: buffer, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer,
    mimeType: mimeMap[format] || 'image/jpeg',
    ext: extMap[format] || 'jpg',
    info: {
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      outputWidth: info.width,
      outputHeight: info.height,
      outputSize: info.size,
      format,
    },
  };
}

module.exports = { resizeImage };
