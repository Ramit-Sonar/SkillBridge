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

// POST /api/v1/reports -> createReport lets students/clients report another user.
// GET /api/v1/reports -> getReports lists reports for admin investigation.
router
  .route("/")
  .post(verifyJWT, reportSubmitterRoles, reportAttachmentUpload, createReport)
  .get(verifyJWT, adminRoles, getReports);

// GET /api/v1/reports/users/:userId -> getReportedUserDetails opens read-only reported user data.
router
  .route("/users/:userId")
  .get(verifyJWT, adminRoles, getReportedUserDetails);

// GET /api/v1/reports/:reportId -> getReportById returns one admin report detail.
router.route("/:reportId").get(verifyJWT, adminRoles, getReportById);

// PATCH /api/v1/reports/:reportId/resolve -> resolveReport marks a report handled.
router.route("/:reportId/resolve").patch(verifyJWT, adminRoles, resolveReport);

// PATCH /api/v1/reports/:reportId/dismiss -> dismissReport closes a report without action.
router.route("/:reportId/dismiss").patch(verifyJWT, adminRoles, dismissReport);

export default router;
