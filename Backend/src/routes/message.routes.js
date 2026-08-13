import { Router } from "express";
import {
  createMessage,
  getMessagesByProject,
  markMessageRead,
} from "../controllers/message.controller.js";
import { ensureActiveAccount } from "../middlewares/accountStatus.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { jobAttachmentUpload } from "../middlewares/multer.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { removeTempFiles } from "../utils/tempFile.js";

const router = Router();
const projectMessageRoles = authorizeRoles("student", "client");
const messageAttachmentUpload = (req, res, next) => {
  // Project messages use the same safe attachment rules as project files.
  jobAttachmentUpload.array("attachments", 3)(req, res, (error) => {
    if (error) {
      removeTempFiles(req.files);
      next(error);
      return;
    }

    next();
  });
};

router
  .route("/projects/:projectId/messages")
  .get(verifyJWT, projectMessageRoles, getMessagesByProject)
  .post(
    verifyJWT,
    projectMessageRoles,
    ensureActiveAccount,
    messageAttachmentUpload,
    createMessage
  );

router
  .route("/messages/:messageId/read")
  .patch(verifyJWT, projectMessageRoles, ensureActiveAccount, markMessageRead);

export default router;
