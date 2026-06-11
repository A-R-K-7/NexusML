const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'nexusml_minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'nexusml_minio_secret',
});

const BUCKET = process.env.MINIO_BUCKET || 'nexusml-datasets';

/**
 * Ensure bucket exists; create if not
 */
const ensureBucket = async () => {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1');
    console.log(`✅ MinIO bucket '${BUCKET}' created`);
  }
};

/**
 * Upload a file buffer to MinIO
 */
const uploadFile = async (objectKey, buffer, mimeType = 'application/octet-stream') => {
  await ensureBucket();
  await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
    'Content-Type': mimeType,
  });
  return objectKey;
};

/**
 * Get a presigned URL for downloading a file
 */
const getPresignedUrl = async (objectKey, expiresSeconds = 3600) => {
  return minioClient.presignedGetObject(BUCKET, objectKey, expiresSeconds);
};

/**
 * Delete a file from MinIO
 */
const deleteFile = async (objectKey) => {
  await minioClient.removeObject(BUCKET, objectKey);
};

/**
 * Get file as a stream
 */
const getFileStream = async (objectKey) => {
  return minioClient.getObject(BUCKET, objectKey);
};

module.exports = { uploadFile, getPresignedUrl, deleteFile, getFileStream, ensureBucket };
