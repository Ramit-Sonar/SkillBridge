import { v2 as cloudinary } from "cloudinary";
import { removeTempFile } from "./tempFile.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a temporary file to Cloudinary and removes the local copy afterward.
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    removeTempFile(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);

    removeTempFile(localFilePath);

    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  const resourceTypes = ["image", "raw", "video"];

  // Attachments may be stored under different Cloudinary resource types.
  for (const resourceType of resourceTypes) {
    try {
      const response = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (response?.result === "ok") {
        return;
      }
    } catch (error) {
      console.error("Cloudinary Delete Error:", error.message);
    }
  }
};

export { deleteFromCloudinary, uploadOnCloudinary };
