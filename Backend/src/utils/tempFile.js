import fs from "fs";

/*
 * Removes temporary upload files created by multer.
 */
export const removeTempFile = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return;

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Temp file cleanup failed:", error.message);
  }
};

export const removeTempFiles = (files) => {
  if (!files) return;

  if (Array.isArray(files)) {
    files.forEach((file) => removeTempFile(file?.path));
    return;
  }

  Object.values(files)
    .flat()
    .forEach((file) => removeTempFile(file?.path));
};
