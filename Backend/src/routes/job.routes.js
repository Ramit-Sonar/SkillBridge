import { Router } from "express";
import {
  cancelJob,
  createJob,
  getAllOpenJobs,
  getClientJobs,
  getJobById,
  updateJob,
} from "../controllers/job.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const studentRoles = authorizeRoles("student");
const clientRoles = authorizeRoles("client");

router
  .route("/")
  .post(
    verifyJWT,
    clientRoles,
    jobAttachmentUpload.array("attachments", 3),
    createJob
  )
  .get(verifyJWT, studentRoles, getAllOpenJobs);

router.route("/my-jobs").get(verifyJWT, clientRoles, getClientJobs);

router
  .route("/:jobId")
  .get(verifyJWT, getJobById)
  .patch(
    verifyJWT,
    clientRoles,
    jobAttachmentUpload.array("attachments", 3),
    updateJob
  );

router.route("/:jobId/cancel").patch(verifyJWT, clientRoles, cancelJob);

export default router;
