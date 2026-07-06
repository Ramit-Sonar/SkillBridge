import mongoose from "mongoose";

export const timelineSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "project_created",
        "deliverable_submitted",
        "revision_requested",
        "deliverable_resubmitted",
        "deliverable_approved",
        "project_completed",
      ],
      required: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);
