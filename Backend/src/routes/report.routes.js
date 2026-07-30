import { Router } from "express";
import {
  createReport,
  dismissReport,
  getReportById,
  getReports,
  getReportedUserDetails,
  resolveReport,
} from "../controllers/report.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { removeTempFiles } from "../utils/tempFile.js";

const router = Router();
const reportSubmitterRoles = authorizeRoles("student", "client");
const adminRoles = authorizeRoles("admin");
const reportAttachmentUpload = (req, res, next) => {
  // Report evidence uses the same attachment rules as job/application files.
  jobAttachmentUpload.array("attachments", 3)(req, res, (error) => {
    if (error) {
      removeTempFiles(req.files);
      next(error);
      return;
    }

    next();
  });
};

// Report routes for user submissions and admin review.
router
  .route("/")
  .post(verifyJWT, reportSubmitterRoles, reportAttachmentUpload, createReport)
  .get(verifyJWT, adminRoles, getReports);

router
  .route("/users/:userId")
  .get(verifyJWT, adminRoles, getReportedUserDetails);

router.route("/:reportId").get(verifyJWT, adminRoles, getReportById);

router.route("/:reportId/resolve").patch(verifyJWT, adminRoles, resolveReport);

router.route("/:reportId/dismiss").patch(verifyJWT, adminRoles, dismissReport);

export default router;
