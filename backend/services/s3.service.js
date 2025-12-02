const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} originalName - Original filename
 * @param {String} mimetype - File MIME type
 * @param {String} folder - S3 folder (e.g., 'requests' or 'deliveries')
 * @returns {Promise<Object>} - { key, url }
 */
const uploadFile = async (
  fileBuffer,
  originalName,
  mimetype,
  folder = "uploads"
) => {
  try {
    // Generate unique filename
    const fileExtension = originalName.split(".").pop();
    const randomName = crypto.randomBytes(16).toString("hex");
    const key = `${folder}/${randomName}.${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    // Return the key (we'll generate signed URLs when needed)
    return {
      key,
      bucket: BUCKET_NAME,
      originalName,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Get signed URL for private object (expires in 1 hour)
 * @param {String} key - S3 object key
 * @returns {Promise<String>} - Signed URL
 */
const getSignedDownloadUrl = async (key) => {
  try {
    if (!key) return null;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // URL expires in 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {String} key - S3 object key
 */
const deleteFile = async (key) => {
  try {
    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Upload multiple files
 * @param {Array} files - Array of { buffer, originalname, mimetype }
 * @param {String} folder - S3 folder
 * @returns {Promise<Array>} - Array of { key, url }
 */
const uploadMultipleFiles = async (files, folder = "uploads") => {
  try {
    const uploadPromises = files.map((file) =>
      uploadFile(file.buffer, file.originalname, file.mimetype, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Multiple upload error:", error);
    throw new Error(`Failed to upload multiple files: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  getSignedDownloadUrl,
  deleteFile,
  uploadMultipleFiles,
};
