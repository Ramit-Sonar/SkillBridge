import { Router } from "express";
import {
  approveDeliverable,
  getMyProjects,
  getProjectById,
  getProjectDeliverables,
  getProjectRevisions,
  getProjectTimeline,
  requestRevision,
  submitDeliverable,
} from "../controllers/project.controller.js";
import { ensureActiveAccount } from "../middlewares/accountStatus.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { removeTempFiles } from "../utils/tempFile.js";

const router = Router();
const projectRoles = authorizeRoles("student", "client");
const clientRoles = authorizeRoles("client");
const studentRoles = authorizeRoles("student");
const deliverableAttachmentUpload = (req, res, next) => {
  // Deliverable and revision attachments use the shared project upload policy.
  jobAttachmentUpload.array("attachments", 3)(req, res, (error) => {
    if (error) {
      removeTempFiles(req.files);
      next(error);
      return;
    }

    next();
  });
};

router.route("/my-projects").get(verifyJWT, projectRoles, getMyProjects);
router
  .route("/:projectId/deliverables/approve")
  .patch(verifyJWT, clientRoles, ensureActiveAccount, approveDeliverable);
router
  .route("/:projectId/deliverables/request-revision")
  .post(
    verifyJWT,
    clientRoles,
    ensureActiveAccount,
    deliverableAttachmentUpload,
    requestRevision
  );
router
  .route("/:projectId/deliverables")
  .get(verifyJWT, projectRoles, getProjectDeliverables)
  .post(
    verifyJWT,
    studentRoles,
    ensureActiveAccount,
    deliverableAttachmentUpload,
    submitDeliverable
  );
router
  .route("/:projectId/revisions")
  .get(verifyJWT, projectRoles, getProjectRevisions);
router
  .route("/:projectId/timeline")
  .get(verifyJWT, projectRoles, getProjectTimeline);
router.route("/:projectId").get(verifyJWT, projectRoles, getProjectById);

export default router;
