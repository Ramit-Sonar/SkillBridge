import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { removeTempFile } from "./tempFile.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
 * Uploads a temporary file to Cloudinary and removes the local copy afterward.
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const fileExtension = path.extname(localFilePath).toLowerCase();
    const rawFileExtensions = [
      ".pdf",
      ".txt",
      ".zip",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
    ];
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: rawFileExtensions.includes(fileExtension) ? "raw" : "auto",
    });

    removeTempFile(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);

    removeTempFile(localFilePath);

    return null;
  }
};

const getAttachmentFormat = (attachment) => {
  const fileExtension = path
    .extname(attachment?.originalName || attachment?.url || "")
    .replace(".", "")
    .toLowerCase();

  if (fileExtension) return fileExtension;

  if (attachment?.mimeType === "application/pdf") return "pdf";

  return "";
};

const getCloudinaryResourceTypeFromUrl = (url = "") => {
  if (url.includes("/raw/upload/")) return "raw";
  if (url.includes("/image/upload/")) return "image";
  if (url.includes("/video/upload/")) return "video";

  return "";
};

const getCloudinaryDownloadUrls = (attachment) => {
  if (!attachment?.publicId) return [];

  const format = getAttachmentFormat(attachment);
  const resourceTypes = [
    getCloudinaryResourceTypeFromUrl(attachment.url),
    attachment.mimeType === "application/pdf" ? "image" : "",
    "raw",
    "image",
  ].filter(Boolean);
  const uniqueResourceTypes = [...new Set(resourceTypes)];

  return uniqueResourceTypes
    .map((resourceType) => {
      try {
        return cloudinary.utils.private_download_url(
          attachment.publicId,
          format,
          {
            resource_type: resourceType,
            type: "upload",
            attachment: true,
            expires_at: Math.floor(Date.now() / 1000) + 60,
          }
        );
      } catch {
        return "";
      }
    })
    .filter(Boolean);
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

export { deleteFromCloudinary, getCloudinaryDownloadUrls, uploadOnCloudinary };
