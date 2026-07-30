import { Router } from "express";
import {
  activateAdminUser,
  getAdminDashboardSummary,
  getAdminJobById,
  getAdminJobs,
  getAdminSettings,
  getAdminUserById,
  getAdminUsers,
  getPublicPlatformSettings,
  suspendAdminJob,
  suspendAdminUser,
  updateGeneralSettings,
  updateMaintenanceSettings,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const adminRoles = authorizeRoles("admin");

// Public admin settings route.
router.route("/settings/public").get(getPublicPlatformSettings);

// Protected admin dashboard and settings routes.
router.route("/dashboard").get(verifyJWT, adminRoles, getAdminDashboardSummary);

router.route("/settings").get(verifyJWT, adminRoles, getAdminSettings);

router
  .route("/settings/general")
  .patch(verifyJWT, adminRoles, updateGeneralSettings);

router
  .route("/settings/maintenance")
  .patch(verifyJWT, adminRoles, updateMaintenanceSettings);

// Protected admin user and job management routes.
router.route("/users").get(verifyJWT, adminRoles, getAdminUsers);

router.route("/jobs").get(verifyJWT, adminRoles, getAdminJobs);

router.route("/jobs/:jobId").get(verifyJWT, adminRoles, getAdminJobById);

router
  .route("/jobs/:jobId/suspend")
  .patch(verifyJWT, adminRoles, suspendAdminJob);

router.route("/users/:userId").get(verifyJWT, adminRoles, getAdminUserById);

router
  .route("/users/:userId/suspend")
  .patch(verifyJWT, adminRoles, suspendAdminUser);

router
  .route("/users/:userId/activate")
  .patch(verifyJWT, adminRoles, activateAdminUser);

export default router;
