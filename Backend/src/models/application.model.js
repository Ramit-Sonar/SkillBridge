import mongoose from "mongoose";
import { attachmentSchema } from "../schemas/attachment.schema.js";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coverMessage: {
      type: String,
      required: true,
      trim: true,
    },

    estimatedCompletionTime: {
      type: String,
      required: true,
      trim: true,
    },

    whySuitable: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    withdrawnAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One student can apply only once to the same job
applicationSchema.index({ job: 1, student: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ job: 1, appliedAt: -1 });
applicationSchema.index({ student: 1, createdAt: -1 });
applicationSchema.index({ student: 1, appliedAt: -1 });

export const Application = mongoose.model("Application", applicationSchema);
