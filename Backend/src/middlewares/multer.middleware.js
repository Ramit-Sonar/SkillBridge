import multer from "multer";
import path from "path"; // 1. You must import path here
import { ApiError } from "../utils/ApiError.js";

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const allowedAttachmentTypes = [
  "application/pdf",
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.android.package-archive",
  "application/x-msdownload",
  "application/postscript",
  "image/vnd.adobe.photoshop",
  "application/x-photoshop",
  "application/illustrator",
];
const allowedRawAttachmentExtensions = [".fig", ".psd", ".ai", ".exe"];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    //  2. Get the extension of the original file (e.g., '.jpg' or '.png')
    const fileExtension = path.extname(file.originalname);

    // 3. Append the extension to the end of your filename
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const fileFilter = function (req, file, cb) {
  if (!allowedImageTypes.includes(file.mimetype)) {
    cb(
      new ApiError(400, "Only JPG, JPEG, PNG and WEBP image files are allowed")
    );
    return;
  }

  cb(null, true);
};

const attachmentFileFilter = function (req, file, cb) {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const isAllowedRawFile =
    file.mimetype === "application/octet-stream" &&
    allowedRawAttachmentExtensions.includes(fileExtension);

  if (!allowedAttachmentTypes.includes(file.mimetype) && !isAllowedRawFile) {
    cb(new ApiError(400, "This attachment file type is not allowed"));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter,
});

export const jobAttachmentUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 3,
  },
  fileFilter: attachmentFileFilter,
});
