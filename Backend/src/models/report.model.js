import mongoose, { Schema } from "mongoose";
import { attachmentSchema } from "../schemas/attachment.schema.js";

export const REPORT_REASONS = [
  "Scam / Fraud",
  "Fake Profile",
  "Harassment",
  "Spam",
  "Inappropriate Behavior",
  "Other",
];

export const REPORT_STATUSES = ["pending", "resolved", "dismissed"];

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "pending",
      required: true,
      index: true,
    },
    handledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reportSchema.pre("validate", function (next) {
  if (
    this.reporter &&
    this.reportedUser &&
    this.reporter.toString() === this.reportedUser.toString()
  ) {
    this.invalidate("reportedUser", "A user cannot report their own account.");
  }

  if (this.status === "resolved") {
    if (!this.handledBy) {
      this.invalidate("handledBy", "Resolved reports require an admin handler.");
    }

    if (!this.resolvedAt) {
      this.invalidate("resolvedAt", "Resolved reports require a resolved date.");
    }
  }

  if (this.status === "dismissed") {
    if (!this.handledBy) {
      this.invalidate("handledBy", "Dismissed reports require an admin handler.");
    }

    if (!this.dismissedAt) {
      this.invalidate("dismissedAt", "Dismissed reports require a dismissed date.");
    }
  }

  next();
});

reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ handledBy: 1, updatedAt: -1 });

export const Report = mongoose.model("Report", reportSchema);
