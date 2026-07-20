import { Router } from "express";
import {
  getAdminStudentVerificationById,
  getAdminStudentVerifications,
  getVerificationStatus,
  submitClientVerification,
  submitStudentVerification,
  updateClientVerification,
  updateStudentVerification,
} from "../controllers/verification.controller.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
const studentRoles = authorizeRoles("student");
const clientRoles = authorizeRoles("client");
const adminRoles = authorizeRoles("admin");

router
  .route("/admin/students")
  .get(verifyJWT, adminRoles, getAdminStudentVerifications);

router
  .route("/admin/students/:id")
  .get(verifyJWT, adminRoles, getAdminStudentVerificationById);

router
  .route("/student")
  .post(
    verifyJWT,
    studentRoles,
    upload.fields([
      { name: "idCard", maxCount: 1 },
      { name: "selfie", maxCount: 1 },
    ]),
    submitStudentVerification
  )
  .patch(
    verifyJWT,
    studentRoles,
    upload.fields([
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
    upload.fields([
      { name: "citizenshipFront", maxCount: 1 },
      { name: "citizenshipSelfie", maxCount: 1 },
      { name: "companyRegistration", maxCount: 1 },
    ]),
    submitClientVerification
  )
  .patch(
    verifyJWT,
    clientRoles,
    upload.fields([
      { name: "citizenshipFront", maxCount: 1 },
      { name: "citizenshipSelfie", maxCount: 1 },
      { name: "companyRegistration", maxCount: 1 },
    ]),
    updateClientVerification
  );

router.route("/status").get(verifyJWT, getVerificationStatus);

export default router;
