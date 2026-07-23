import { Router } from "express";
import {
  activateAdminUser,
  createReport,
  dismissReport,
  getAdminUserById,
  getAdminUsers,
  getReportById,
  getReports,
  resolveReport,
  suspendAdminUser,
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

// GET /api/v1/reports/admin/users -> getAdminUsers powers admin user cards.
router.route("/admin/users").get(verifyJWT, adminRoles, getAdminUsers);

// GET /api/v1/reports/admin/users/:userId -> getAdminUserById powers shared profile modals.
router
  .route("/admin/users/:userId")
  .get(verifyJWT, adminRoles, getAdminUserById);

// PATCH /api/v1/reports/admin/users/:userId/suspend -> suspendAdminUser disables an account.
router
  .route("/admin/users/:userId/suspend")
  .patch(verifyJWT, adminRoles, suspendAdminUser);

// PATCH /api/v1/reports/admin/users/:userId/activate -> activateAdminUser restores an account.
router
  .route("/admin/users/:userId/activate")
  .patch(verifyJWT, adminRoles, activateAdminUser);

// GET /api/v1/reports/:reportId -> getReportById returns one admin report detail.
router.route("/:reportId").get(verifyJWT, adminRoles, getReportById);

// PATCH /api/v1/reports/:reportId/resolve -> resolveReport marks a report handled.
router.route("/:reportId/resolve").patch(verifyJWT, adminRoles, resolveReport);

// PATCH /api/v1/reports/:reportId/dismiss -> dismissReport closes a report without action.
router.route("/:reportId/dismiss").patch(verifyJWT, adminRoles, dismissReport);

export default router;
