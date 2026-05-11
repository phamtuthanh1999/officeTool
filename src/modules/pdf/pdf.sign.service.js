const { PDFDocument, degrees } = require('pdf-lib');
const AppError = require('../../utils/AppError');

/**
 * Vị trí preset — tính theo % từ góc dưới-trái của trang
 */
const POSITION_PRESETS = {
  'bottom-right':  { xPct: 0.72, yPct: 0.05 },
  'bottom-left':   { xPct: 0.04, yPct: 0.05 },
  'bottom-center': { xPct: 0.38, yPct: 0.05 },
  'top-right':     { xPct: 0.72, yPct: 0.90 },
  'top-left':      { xPct: 0.04, yPct: 0.90 },
  'center':        { xPct: 0.38, yPct: 0.45 },
};

/**
 * Nhúng chữ ký PNG vào file PDF.
 *
 * @param {Buffer} pdfBuffer          - Buffer của file PDF gốc
 * @param {Buffer} signatureBuffer    - Buffer của ảnh PNG chữ ký
 * @param {object} opts
 * @param {string|number} opts.page         - 'all' | 'first' | 'last' | số trang (1-based)
 * @param {string}        opts.position     - preset key hoặc 'custom'
 * @param {number}        [opts.xPct]       - 0-1, khi position='custom'
 * @param {number}        [opts.yPct]       - 0-1, khi position='custom'
 * @param {number}        [opts.sigWidth]   - chiều rộng chữ ký (px trên trang), default 160
 * @returns {Promise<Buffer>}
 */
async function signPdf(pdfBuffer, signatureBuffer, opts = {}) {
  const {
    page: pageOpt = 'last',
    position = 'bottom-right',
    xPct: customX,
    yPct: customY,
    sigWidth = 160,
    anchorFromTop = false,
  } = opts;

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: false });
  } catch (err) {
    throw new AppError('Không thể đọc file PDF. File có thể bị hỏng hoặc được bảo vệ bằng mật khẩu.', 400);
  }

  // Nhúng ảnh PNG chữ ký
  let pngImage;
  try {
    pngImage = await pdfDoc.embedPng(signatureBuffer);
  } catch {
    try {
      pngImage = await pdfDoc.embedJpg(signatureBuffer);
    } catch {
      throw new AppError('Không thể đọc ảnh chữ ký. Chỉ hỗ trợ PNG hoặc JPG.', 400);
    }
  }

  const { width: imgW, height: imgH } = pngImage.size();
  const aspectRatio = imgH / imgW;
  const drawWidth = sigWidth;
  const drawHeight = drawWidth * aspectRatio;

  const totalPages = pdfDoc.getPageCount();
  if (totalPages === 0) throw new AppError('PDF không có trang nào.', 400);

  // Xác định các trang cần ký
  let pageIndices;
  if (pageOpt === 'all') {
    pageIndices = Array.from({ length: totalPages }, (_, i) => i);
  } else if (pageOpt === 'first') {
    pageIndices = [0];
  } else if (pageOpt === 'last') {
    pageIndices = [totalPages - 1];
  } else {
    const n = parseInt(pageOpt, 10);
    if (isNaN(n) || n < 1 || n > totalPages) {
      throw new AppError(`Số trang không hợp lệ. PDF có ${totalPages} trang.`, 400);
    }
    pageIndices = [n - 1];
  }

  // Lấy tọa độ dựa trên preset hoặc custom
  let baseXPct, baseYPct;
  if (position === 'custom' && customX !== undefined && customY !== undefined) {
    baseXPct = Math.max(0, Math.min(1, customX));
    baseYPct = Math.max(0, Math.min(1, customY));
  } else {
    const preset = POSITION_PRESETS[position] || POSITION_PRESETS['bottom-right'];
    baseXPct = preset.xPct;
    baseYPct = preset.yPct;
  }

  // Vẽ chữ ký lên từng trang
  for (const idx of pageIndices) {
    const page = pdfDoc.getPage(idx);
    const { width: pageW, height: pageH } = page.getSize();

    const x = baseXPct * pageW;

    // Compute y: anchorFromTop=true → yPct is fraction from top, image placed top-left there
    let yForDraw;
    if (anchorFromTop) {
      yForDraw = pageH - baseYPct * pageH - drawHeight;
    } else {
      yForDraw = baseYPct * pageH;
    }

    // Clamp so signature stays within the page
    const clampedX = Math.max(0, Math.min(x, pageW - drawWidth));
    const clampedY = Math.max(0, Math.min(pageH - drawHeight, yForDraw));

    page.drawImage(pngImage, {
      x: clampedX,
      y: clampedY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  const signedBytes = await pdfDoc.save();
  return Buffer.from(signedBytes);
}

module.exports = { signPdf };
