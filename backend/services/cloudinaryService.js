import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const uploadResumeToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'raw',
      folder: 'resumes',
      public_id: `resume_${Date.now()}_${fileName}`,
      use_filename: true,
      unique_filename: false,
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            bytes: result.bytes,
            format: result.format
          });
        }
      }
    ).end(fileBuffer);
  });
};

export const deleteResumeFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: 'raw' 
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};