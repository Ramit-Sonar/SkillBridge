import mongoose, { Schema } from "mongoose";

/**
 * Stores singleton platform-wide settings controlled by administrators.
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "platform",
      unique: true,
      immutable: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      trim: true,
      default: "SkillBridge is currently under maintenance.",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

export const PlatformSettings = mongoose.model(
  "PlatformSettings",
  platformSettingsSchema
);
