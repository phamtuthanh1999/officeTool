const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const AppError = require('../../utils/AppError');

// ── Định dạng ảnh đầu ra được hỗ trợ ─────────────────────────────────────────
const IMAGE_OUTPUT_FORMATS = {
  PNG:  { ext: 'png',  mime: 'image/png',  sharpFormat: 'png' },
  JPG:  { ext: 'jpg',  mime: 'image/jpeg', sharpFormat: 'jpeg' },
  JPEG: { ext: 'jpg',  mime: 'image/jpeg', sharpFormat: 'jpeg' },
  WEBP: { ext: 'webp', mime: 'image/webp', sharpFormat: 'webp' },
  BMP:  { ext: 'bmp',  mime: 'image/bmp',  sharpFormat: 'bmp' },
  TIFF: { ext: 'tiff', mime: 'image/tiff', sharpFormat: 'tiff' },
  GIF:  { ext: 'gif',  mime: 'image/gif',  sharpFormat: 'gif' },
};

// MIME type của ảnh mà sharp có thể đọc
const IMAGE_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/bmp', 'image/tiff', 'image/gif', 'image/svg+xml',
]);

function isImage(file) {
  return IMAGE_MIME_TYPES.has((file.mimetype || '').toLowerCase());
}

function nameWithoutExt(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

// ── Chuyển ảnh sang định dạng ảnh khác (sharp) ───────────────────────────────
async function convertImageToFormat(buffer, sharpFormat) {
  return sharp(buffer).toFormat(sharpFormat).toBuffer();
}

// ── Chuyển nhiều ảnh sang PDF (mỗi ảnh 1 trang A4) ──────────────────────────
async function convertImagesToPdf(files) {
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 40;
  const maxW = PAGE_WIDTH - MARGIN * 2;
  const maxH = PAGE_HEIGHT - MARGIN * 2;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, margin: 0, size: [PAGE_WIDTH, PAGE_HEIGHT] });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    files.forEach((file) => {
      doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
      doc.image(file.buffer, MARGIN, MARGIN, { fit: [maxW, maxH], align: 'center', valign: 'center' });
    });
    doc.end();
  });
}

// ── Đóng gói nhiều buffer thành file ZIP ─────────────────────────────────────
async function zipBuffers(entries) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 6 } });
    const chunks = [];
    archive.on('data', (c) => chunks.push(c));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
    entries.forEach(({ name, buffer }) => archive.append(buffer, { name }));
    archive.finalize();
  });
}

// ── Hàm chuyển đổi chính ─────────────────────────────────────────────────────
/**
 * @param {Array<{ buffer: Buffer, originalname: string, mimetype: string }>} files
 * @param {string} targetFormat  - ví dụ "PDF", "PNG", "WEBP"
 * @returns {{ buffer: Buffer, mime: string, filename: string }}
 */
async function convertFiles(files, targetFormat) {
  const target = targetFormat.toUpperCase().trim();

  // ── Ảnh → PDF ──────────────────────────────────────────────────────────────
  if (target === 'PDF') {
    const imageFiles = files.filter(isImage);
    if (imageFiles.length === 0) {
      throw new AppError('Chỉ hỗ trợ chuyển ảnh (JPG/PNG/WEBP/BMP/TIFF/GIF) sang PDF.', 400);
    }
    const pdfBuffer = await convertImagesToPdf(imageFiles);
    const filename = imageFiles.length === 1
      ? `${nameWithoutExt(imageFiles[0].originalname)}.pdf`
      : 'converted.pdf';
    return { buffer: pdfBuffer, mime: 'application/pdf', filename };
  }

  // ── Ảnh → Ảnh ──────────────────────────────────────────────────────────────
  const fmt = IMAGE_OUTPUT_FORMATS[target];
  if (fmt) {
    const imageFiles = files.filter(isImage);
    if (imageFiles.length === 0) {
      throw new AppError(`Chỉ hỗ trợ chuyển ảnh sang định dạng ${target}.`, 400);
    }

    if (imageFiles.length === 1) {
      const outBuffer = await convertImageToFormat(imageFiles[0].buffer, fmt.sharpFormat);
      return {
        buffer: outBuffer,
        mime: fmt.mime,
        filename: `${nameWithoutExt(imageFiles[0].originalname)}.${fmt.ext}`,
      };
    }

    // Nhiều ảnh → đóng gói ZIP
    const entries = await Promise.all(
      imageFiles.map(async (f) => ({
        name: `${nameWithoutExt(f.originalname)}.${fmt.ext}`,
        buffer: await convertImageToFormat(f.buffer, fmt.sharpFormat),
      })),
    );
    const zipBuffer = await zipBuffers(entries);
    return { buffer: zipBuffer, mime: 'application/zip', filename: 'converted_images.zip' };
  }

  // ── Định dạng chưa hỗ trợ ──────────────────────────────────────────────────
  throw new AppError(
    `Định dạng "${targetFormat}" chưa được hỗ trợ. Hiện hỗ trợ: PDF, PNG, JPG, WEBP, BMP, TIFF, GIF.`,
    400,
  );
}

module.exports = { convertFiles };
