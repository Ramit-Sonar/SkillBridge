import { Router } from "express";
import { submitApplication } from "../controllers/application.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const studentRoles = authorizeRoles("student");

router
  .route("/:jobId")
  .post(
    verifyJWT,
    studentRoles,
    jobAttachmentUpload.array("attachments", 3),
    submitApplication
  );

export default router;
