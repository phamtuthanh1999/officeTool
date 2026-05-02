const { google } = require('googleapis');
const { Readable } = require('stream');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');

// Tên folder mặc định trên Drive
const DRIVE_FOLDER_NAME = 'Convert PDFs';

/**
 * Tạo OAuth2 client đã được set access_token từ client gửi lên.
 */
const createAuthClient = (googleAccessToken) => {
  const auth = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL,
  );
  auth.setCredentials({ access_token: googleAccessToken });
  return auth;
};

/**
 * Tìm folder theo tên, nếu chưa có thì tạo mới.
 * @returns {string} folderId
 */
const getOrCreateFolder = async (drive, folderName) => {
  // Tìm folder đã tồn tại
  const search = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (search.data.files.length > 0) {
    return search.data.files[0].id;
  }

  // Tạo folder mới nếu chưa có
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  return folder.data.id;
};

/**
 * Upload file lên Google Drive của user, vào folder chỉ định.
 *
 * @param {string} googleAccessToken - Google access token của user
 * @param {Buffer} fileBuffer - Buffer của file cần upload
 * @param {string} fileName - Tên file trên Drive
 * @param {string} mimeType - MIME type của file
 * @returns {{ fileId, driveLink, folderName }} - ID và link xem file
 */
const uploadToDrive = async (googleAccessToken, fileBuffer, fileName, mimeType) => {
  const auth = createAuthClient(googleAccessToken);
  const drive = google.drive({ version: 'v3', auth });

  // Tìm hoặc tạo folder chứa file
  let folderId;
  try {
    folderId = await getOrCreateFolder(drive, DRIVE_FOLDER_NAME);
  } catch (err) {
    throw new AppError(`Không thể tạo folder trên Drive: ${err.message}`, 502);
  }

  // Chuyển Buffer → Readable stream (Drive API yêu cầu stream)
  const stream = Readable.from(fileBuffer);

  let fileId;
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        // Đưa file vào đúng folder
        parents: [folderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id',
    });
    fileId = response.data.id;
  } catch (err) {
    if (err.code === 401 || (err.response && err.response.status === 401)) {
      throw new AppError('Google access token hết hạn. Vui lòng đăng nhập lại.', 401);
    }
    if (err.code === 403 || (err.response && err.response.status === 403)) {
      throw new AppError('Không có quyền truy cập Google Drive. Vui lòng đăng nhập lại và cấp quyền Drive.', 403);
    }
    throw new AppError(`Upload lên Google Drive thất bại: ${err.message}`, 502);
  }

  const driveLink = `https://drive.google.com/file/d/${fileId}/view`;
  const folderLink = `https://drive.google.com/drive/folders/${folderId}`;

  return {
    fileId, driveLink, folderName: DRIVE_FOLDER_NAME, folderLink,
  };
};

module.exports = { uploadToDrive };
