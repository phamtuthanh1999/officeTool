const PDFDocument = require('pdfkit');
const AppError = require('../../utils/AppError');

// Kích thước trang A4 (points: 1pt = 1/72 inch)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 40;

/**
 * Chuyển đổi nhiều ảnh thành 1 file PDF.
 * Mỗi ảnh là 1 trang, giữ tỉ lệ, canh giữa.
 * pdfkit tự đọc dimension và scale ảnh qua option `fit`.
 *
 * @param {Array<{ buffer: Buffer, mimetype: string, originalname: string }>} files
 * @returns {Promise<Buffer>} Buffer của file PDF
 */
const convertImagesToPdf = async (files) => {
  try {
    const maxW = PAGE_WIDTH - PAGE_MARGIN * 2;
    const maxH = PAGE_HEIGHT - PAGE_MARGIN * 2;

    return await new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        autoFirstPage: false,
        margin: 0,
        size: [PAGE_WIDTH, PAGE_HEIGHT],
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      files.forEach((file) => {
        doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
        // fit: scale ảnh vừa khung (giữ tỉ lệ)
        // align/valign: canh giữa trang
        doc.image(file.buffer, PAGE_MARGIN, PAGE_MARGIN, {
          fit: [maxW, maxH],
          align: 'center',
          valign: 'center',
        });
      });

      doc.end();
    });
  } catch (err) {
    throw new AppError(`Lỗi khi tạo PDF: ${err.message}`, 500);
  }
};

module.exports = { convertImagesToPdf };
