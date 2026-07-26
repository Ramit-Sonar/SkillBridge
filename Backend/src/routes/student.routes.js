import { Router } from "express";
import {
  addStudentCertificate,
  deleteStudentCertificate,
  getPublicStudentProfile,
  getStudentCertificates,
  getStudentProfile,
  updateStudentCertificate,
  updateStudentProfile,
} from "../controllers/studentProfile.controller.js";
import { ensureActiveAccount } from "../middlewares/accountStatus.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { certificateUpload } from "../middlewares/multer.middleware.js";

const router = Router();
const studentRoles = authorizeRoles("student");

// Student profile routes expose private settings and public portfolio data.
router.route("/public-profile/:studentId").get(getPublicStudentProfile);

router
  .route("/profile")
  .get(verifyJWT, studentRoles, getStudentProfile)
  .put(verifyJWT, studentRoles, ensureActiveAccount, updateStudentProfile);

router
  .route("/certificates")
  .get(verifyJWT, studentRoles, getStudentCertificates)
  .post(
    verifyJWT,
    studentRoles,
    ensureActiveAccount,
    certificateUpload.single("certificateFile"),
    addStudentCertificate
  );

router
  .route("/certificates/:certificateId")
  .patch(
    verifyJWT,
    studentRoles,
    ensureActiveAccount,
    certificateUpload.single("certificateFile"),
    updateStudentCertificate
  )
  .delete(
    verifyJWT,
    studentRoles,
    ensureActiveAccount,
    deleteStudentCertificate
  );

export default router;
