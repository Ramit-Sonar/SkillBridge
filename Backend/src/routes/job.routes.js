import { Router } from "express";
import {
  cancelJob,
  createJob,
  getAllOpenJobs,
  getClientJobs,
  getJobById,
  updateJob,
} from "../controllers/job.controller.js";
import {
  optionalVerifyJWT,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { ensureActiveAccount } from "../middlewares/accountStatus.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { removeTempFiles } from "../utils/tempFile.js";

const router = Router();
const clientRoles = authorizeRoles("client");
const jobUpload = (req, res, next) => {
  // Clean up temporary files when multer rejects an attachment.
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
  .route("/")
  .post(verifyJWT, clientRoles, ensureActiveAccount, jobUpload, createJob)
  .get(optionalVerifyJWT, getAllOpenJobs);

router.route("/my-jobs").get(verifyJWT, clientRoles, getClientJobs);

router
  .route("/:jobId")
  .get(optionalVerifyJWT, getJobById)
  .patch(verifyJWT, clientRoles, ensureActiveAccount, jobUpload, updateJob);

router
  .route("/:jobId/cancel")
  .patch(verifyJWT, clientRoles, ensureActiveAccount, cancelJob);

export default router;
