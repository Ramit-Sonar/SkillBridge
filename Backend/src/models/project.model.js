import mongoose from "mongoose";
import { timelineSchema } from "../schemas/timeline.schema.js";

const projectSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "submitted", "revision_requested", "completed"],
      required: true,
      default: "active",
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastActivityAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    timeline: {
      type: [timelineSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ application: 1 }, { unique: true });
projectSchema.index({ job: 1 }, { unique: true });
projectSchema.index({ student: 1, status: 1 });
projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ status: 1 });

projectSchema.pre("save", function () {
  if (
    this.isNew ||
    this.isModified("status") ||
    this.isModified("completedAt") ||
    this.isModified("timeline")
  ) {
    this.lastActivityAt = new Date();
  }
});

function updateLastActivityAt() {
  const update = this.getUpdate() || {};
  const setUpdate = update.$set || {};
  const hasActivityChange =
    update.status ||
    update.completedAt ||
    update.timeline ||
    setUpdate.status ||
    setUpdate.completedAt ||
    setUpdate.timeline ||
    update.$push?.timeline ||
    update.$addToSet?.timeline;

  if (hasActivityChange) {
    this.set({ lastActivityAt: new Date() });
  }
}

projectSchema.pre("findOneAndUpdate", updateLastActivityAt);
projectSchema.pre("updateOne", updateLastActivityAt);

export const Project = mongoose.model("Project", projectSchema);
