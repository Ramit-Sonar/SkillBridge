import mongoose from "mongoose";
import { attachmentSchema } from "../schemas/attachment.schema.js";

/*
 * Stores versioned project submissions from students.
 */
const deliverableSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    versionNumber: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Version number must be a positive integer",
      },
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    notes: {
      type: String,
      required: true,
      trim: true,
    },

    demoLink: {
      type: String,
      trim: true,
      default: "",
    },

    repositoryLink: {
      type: String,
      trim: true,
      default: "",
    },

    liveUrl: {
      type: String,
      trim: true,
      default: "",
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["submitted", "approved"],
      required: true,
      default: "submitted",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

deliverableSchema.index({ project: 1, versionNumber: 1 }, { unique: true });
deliverableSchema.index({ project: 1, submittedAt: -1 });

export const Deliverable = mongoose.model("Deliverable", deliverableSchema);
