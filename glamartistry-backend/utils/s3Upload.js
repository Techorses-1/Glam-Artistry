const s3 = require("../config/awsS3");
const { v4: uuidv4 } = require("uuid");

// Upload single file to S3
const uploadToS3 = async (file, folderPath) => {
  try {
    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${folderPath}/${uuidv4()}.${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();
    return result.Location; // Returns public URL
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

// Upload multiple files to S3
const uploadMultipleToS3 = async (files, folderPath) => {
  try {
    const uploadPromises = files.map((file) => uploadToS3(file, folderPath));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    throw new Error(`Multiple upload failed: ${error.message}`);
  }
};

// Delete file from S3 by URL
const deleteFromS3 = async (fileUrl) => {
  try {
    // Extract key from URL
    const urlParts = fileUrl.split("/");
    const key = urlParts.slice(3).join("/");

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error(`S3 delete failed: ${error.message}`);
    return false;
  }
};

// Delete multiple files from S3
const deleteMultipleFromS3 = async (fileUrls) => {
  try {
    const deletePromises = fileUrls.map((url) => deleteFromS3(url));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error(`Multiple delete failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  uploadToS3,
  uploadMultipleToS3,
  deleteFromS3,
  deleteMultipleFromS3,
};