const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Save a file buffer to local disk
 */
const saveFile = async (buffer, objectKey) => {
  const filePath = path.join(UPLOADS_DIR, objectKey.replace(/\//g, '_'));
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

/**
 * Return the public URL for a stored file
 */
const getFileUrl = (objectKey) => {
  const filename = objectKey.replace(/\//g, '_');
  return `${BASE_URL}/uploads/${filename}`;
};

/**
 * Delete a file from disk
 */
const deleteFile = (objectKey) => {
  const filePath = path.join(UPLOADS_DIR, objectKey.replace(/\//g, '_'));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * Check if a file exists
 */
const fileExists = (objectKey) => {
  const filePath = path.join(UPLOADS_DIR, objectKey.replace(/\//g, '_'));
  return fs.existsSync(filePath);
};

module.exports = { saveFile, getFileUrl, deleteFile, fileExists, UPLOADS_DIR };
