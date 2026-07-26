import { Router } from "express";
import {
  acceptApplication,
  getApplicationById,
  getJobApplications,
  getMyApplications,
  rejectApplication,
  submitApplication,
  withdrawApplication,
} from "../controllers/application.controller.js";
import { ensureActiveAccount } from "../middlewares/accountStatus.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { removeTempFiles } from "../utils/tempFile.js";

const router = Router();
const studentRoles = authorizeRoles("student");
const clientRoles = authorizeRoles("client");
const applicationAttachmentUpload = (req, res, next) => {
  // Application uploads share job attachment limits and cleanup behavior.
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
    ensureActiveAccount,
    applicationAttachmentUpload,
    submitApplication
  );

router
  .route("/my-applications")
  .get(verifyJWT, studentRoles, getMyApplications);

router.route("/job/:jobId").get(verifyJWT, clientRoles, getJobApplications);

router.route("/:applicationId").get(verifyJWT, getApplicationById);

router
  .route("/:applicationId/withdraw")
  .patch(verifyJWT, studentRoles, ensureActiveAccount, withdrawApplication);

router
  .route("/:applicationId/accept")
  .patch(verifyJWT, clientRoles, ensureActiveAccount, acceptApplication);

router
  .route("/:applicationId/reject")
  .patch(verifyJWT, clientRoles, ensureActiveAccount, rejectApplication);

export default router;
