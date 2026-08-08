import mongoose from "mongoose";
import { attachmentSchema } from "../schemas/attachment.schema.js";

/*
 * Stores client feedback requests tied to a specific deliverable version.
 */
const revisionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    deliverable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deliverable",
      required: true,
    },

    revisionNumber: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Revision number must be a positive integer",
      },
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    referenceLinks: [
      {
        type: String,
        trim: true,
      },
    ],

    resolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedByDeliverable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deliverable",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

revisionSchema.index({ project: 1, revisionNumber: 1 }, { unique: true });
revisionSchema.index({ project: 1, resolved: 1 });
revisionSchema.index({ project: 1, resolved: 1, revisionNumber: -1 });
revisionSchema.index({ deliverable: 1, revisionNumber: -1 });
revisionSchema.index({ resolvedByDeliverable: 1, revisionNumber: -1 });

export const Revision = mongoose.model("Revision", revisionSchema);
