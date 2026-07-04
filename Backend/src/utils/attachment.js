import { ApiError } from "./ApiError.js";
import { uploadOnCloudinary } from "./cloudinary.js";

export const normalizeSubmittedAttachments = (files) => {
  if (!Array.isArray(files)) return [];

  return files
    .map((file) => {
      if (typeof file === "string") {
        const fileName = file.trim();

        return fileName
          ? {
              url: fileName,
              publicId: "",
              originalName: fileName,
              mimeType: "application/octet-stream",
              size: 0,
            }
          : null;
      }

      const originalName =
        file?.originalName?.trim() || file?.name?.trim() || "";

      if (!originalName) return null;

      return {
        url: file?.url?.trim() || originalName,
        publicId: file?.publicId?.trim() || "",
        originalName,
        mimeType:
          file?.mimeType?.trim() ||
          file?.type?.trim() ||
          "application/octet-stream",
        size: Number(file?.size) || 0,
      };
    })
    .filter(Boolean);
};

export const uploadAttachments = async (uploadedFiles, submittedFiles) => {
  if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
    return normalizeSubmittedAttachments(submittedFiles);
  }

  const attachments = [];

  for (const file of uploadedFiles) {
    const uploadedAttachment = await uploadOnCloudinary(file.path);

    if (!uploadedAttachment?.url) {
      throw new ApiError(500, "Attachment upload failed");
    }

    attachments.push({
      url: uploadedAttachment.secure_url || uploadedAttachment.url,
      publicId: uploadedAttachment.public_id || "",
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  return attachments;
};
