import mongoose, { Schema } from "mongoose";

/*
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
    platformName: {
      type: String,
      trim: true,
      default: "SkillBridge",
      maxlength: 80,
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "support@skillbridge.com",
      maxlength: 120,
    },
    platformDescription: {
      type: String,
      trim: true,
      default:
        "A platform connecting verified students with local clients for real-world projects.",
      maxlength: 300,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: "",
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
