import multer from "multer";
import path from "path"; // 1. You must import path here
import { ApiError } from "../utils/ApiError.js";

/**
 * Configures multer storage and file validation for avatars and attachments.
 */
const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const allowedAttachmentTypes = [
  "application/pdf",
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const allowedAttachmentExtensions = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".txt",
  ".zip",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
];
const allowedCertificateTypes = [
  "application/pdf",
  "image/png",
  "image/jpg",
  "image/jpeg",
];
const allowedCertificateExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
const allowedVerificationDocumentTypes = [...allowedCertificateTypes];
const allowedVerificationDocumentExtensions = [...allowedCertificateExtensions];
const MB = 1024 * 1024;
const AVATAR_FILE_SIZE_LIMIT = 2 * MB;
const ATTACHMENT_FILE_SIZE_LIMIT = 20 * MB;
const CERTIFICATE_FILE_SIZE_LIMIT = 5 * MB;
const VERIFICATION_FILE_SIZE_LIMIT = 5 * MB;
const JOB_ATTACHMENT_FILE_LIMIT = 3;
const SINGLE_CERTIFICATE_FILE_LIMIT = 1;
const VERIFICATION_FILE_LIMIT = 3;

const isAllowedFile = (file, allowedTypes, allowedExtensions) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  return (
    allowedTypes.includes(file.mimetype) &&
    allowedExtensions.includes(fileExtension)
  );
};

const sanitizeFileNamePart = (value) =>
  value
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "file";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const safeFieldName = sanitizeFileNamePart(file.fieldname);

    cb(null, `${safeFieldName}-${uniqueSuffix}${fileExtension}`);
  },
});

const fileFilter = function (req, file, cb) {
  if (!isAllowedFile(file, allowedImageTypes, allowedImageExtensions)) {
    cb(
      new ApiError(400, "Only JPG, JPEG, PNG and WEBP image files are allowed")
    );
    return;
  }

  cb(null, true);
};

const attachmentFileFilter = function (req, file, cb) {
  if (
    !isAllowedFile(file, allowedAttachmentTypes, allowedAttachmentExtensions)
  ) {
    cb(new ApiError(400, "This attachment file type is not allowed"));
    return;
  }

  cb(null, true);
};

const certificateFileFilter = function (req, file, cb) {
  if (
    !isAllowedFile(file, allowedCertificateTypes, allowedCertificateExtensions)
  ) {
    cb(
      new ApiError(
        400,
        "Only PDF, JPG, JPEG and PNG certificate files are allowed"
      )
    );
    return;
  }

  cb(null, true);
};

const verificationFileFilter = function (req, file, cb) {
  const selfieFields = ["selfie", "citizenshipSelfie"];
  const allowedTypes = selfieFields.includes(file.fieldname)
    ? allowedImageTypes
    : allowedVerificationDocumentTypes;
  const allowedExtensions = selfieFields.includes(file.fieldname)
    ? allowedImageExtensions
    : allowedVerificationDocumentExtensions;

  if (!isAllowedFile(file, allowedTypes, allowedExtensions)) {
    cb(new ApiError(400, "Verification files must be JPG, JPEG, PNG or PDF"));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: AVATAR_FILE_SIZE_LIMIT,
  },
  fileFilter,
});

export const jobAttachmentUpload = multer({
  storage,
  limits: {
    fileSize: ATTACHMENT_FILE_SIZE_LIMIT,
    files: JOB_ATTACHMENT_FILE_LIMIT,
  },
  fileFilter: attachmentFileFilter,
});

export const certificateUpload = multer({
  storage,
  limits: {
    fileSize: CERTIFICATE_FILE_SIZE_LIMIT,
    files: SINGLE_CERTIFICATE_FILE_LIMIT,
  },
  fileFilter: certificateFileFilter,
});

export const verificationUpload = multer({
  storage,
  limits: {
    fileSize: VERIFICATION_FILE_SIZE_LIMIT,
    files: VERIFICATION_FILE_LIMIT,
  },
  fileFilter: verificationFileFilter,
});
