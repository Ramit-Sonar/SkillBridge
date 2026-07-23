import { Router } from "express";
import {
  activateAdminUser,
  getAdminDashboardSummary,
  getAdminUserById,
  getAdminUsers,
  suspendAdminUser,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const adminRoles = authorizeRoles("admin");

// GET /api/v1/admin/dashboard -> getAdminDashboardSummary powers admin overview cards.
router.route("/dashboard").get(verifyJWT, adminRoles, getAdminDashboardSummary);

// GET /api/v1/admin/users -> getAdminUsers powers admin user cards.
router.route("/users").get(verifyJWT, adminRoles, getAdminUsers);

// GET /api/v1/admin/users/:userId -> getAdminUserById powers user detail modals.
router.route("/users/:userId").get(verifyJWT, adminRoles, getAdminUserById);

// PATCH /api/v1/admin/users/:userId/suspend -> suspendAdminUser disables an account.
router
  .route("/users/:userId/suspend")
  .patch(verifyJWT, adminRoles, suspendAdminUser);

// PATCH /api/v1/admin/users/:userId/activate -> activateAdminUser restores an account.
router
  .route("/users/:userId/activate")
  .patch(verifyJWT, adminRoles, activateAdminUser);

export default router;
