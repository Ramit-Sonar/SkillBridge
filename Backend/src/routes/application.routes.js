import { Router } from "express";
import { submitApplication } from "../controllers/application.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { removeTempFiles } from "../utils/tempFile.js";

const router = Router();
const studentRoles = authorizeRoles("student");
const applicationAttachmentUpload = (req, res, next) => {
  jobAttachmentUpload.array("attachments", 3)(req, res, (error) => {
    if (error) {
      removeTempFiles(req.files);
      next(error);
      return;
    }

    next();
  });
};

router
  .route("/:jobId")
  .post(
    verifyJWT,
    studentRoles,
    applicationAttachmentUpload,
    submitApplication
  );

export default router;
