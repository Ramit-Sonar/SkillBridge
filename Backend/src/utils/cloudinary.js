import { v2 as cloudinary } from "cloudinary";
import { removeTempFile } from "./tempFile.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

export { uploadOnCloudinary };
