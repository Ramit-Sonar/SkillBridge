import { Router } from "express";
import {
  approveVerification,
  getAdminClientVerifications,
  getAdminStudentVerificationById,
  getAdminStudentVerifications,
  getVerificationStatus,
  rejectVerification,
  submitClientVerification,
  submitStudentVerification,
  updateClientVerification,
  updateStudentVerification,
} from "../controllers/verification.controller.js";
import { ensureActiveAccount } from "../middlewares/accountStatus.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verificationUpload } from "../middlewares/multer.middleware.js";
import { verificationRateLimiter } from "../middlewares/security.middleware.js";

const router = Router();
const studentRoles = authorizeRoles("student");
const clientRoles = authorizeRoles("client");
const adminRoles = authorizeRoles("admin");

// Admin review endpoints are mounted before user submission routes.
router
  .route("/admin/students")
  .get(verifyJWT, adminRoles, getAdminStudentVerifications);

router
  .route("/admin/students/:id")
  .get(verifyJWT, adminRoles, getAdminStudentVerificationById);

router
  .route("/admin/clients")
  .get(verifyJWT, adminRoles, getAdminClientVerifications);

router.route("/:id/approve").patch(verifyJWT, adminRoles, approveVerification);

router.route("/:id/reject").patch(verifyJWT, adminRoles, rejectVerification);

router
  .route("/student")
  .post(
    verifyJWT,
    studentRoles,
    ensureActiveAccount,
    verificationRateLimiter,
    verificationUpload.fields([
      { name: "idCard", maxCount: 1 },
      { name: "selfie", maxCount: 1 },
    ]),
    submitStudentVerification
  )
  .patch(
    verifyJWT,
    studentRoles,
    ensureActiveAccount,
    verificationRateLimiter,
    verificationUpload.fields([
      { name: "idCard", maxCount: 1 },
      { name: "selfie", maxCount: 1 },
    ]),
    updateStudentVerification
  );

router
  .route("/client")
  .post(
    verifyJWT,
    clientRoles,
    ensureActiveAccount,
    verificationRateLimiter,
    verificationUpload.fields([
      { name: "citizenshipFront", maxCount: 1 },
      { name: "citizenshipSelfie", maxCount: 1 },
      { name: "companyRegistration", maxCount: 1 },
    ]),
    submitClientVerification
  )
  .patch(
    verifyJWT,
    clientRoles,
    ensureActiveAccount,
    verificationRateLimiter,
    verificationUpload.fields([
      { name: "citizenshipFront", maxCount: 1 },
      { name: "citizenshipSelfie", maxCount: 1 },
      { name: "companyRegistration", maxCount: 1 },
    ]),
    updateClientVerification
  );

router.route("/status").get(verifyJWT, getVerificationStatus);

export default router;
