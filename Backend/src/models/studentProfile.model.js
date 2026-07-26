import mongoose from "mongoose";
import { attachmentSchema } from "../schemas/attachment.schema.js";

const certificateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    issuingOrganization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    credentialId: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    credentialUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
    file: {
      type: attachmentSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Stores editable public profile details for student accounts.
 */
const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    bio: {
      type: String,
      trim: true,
      default: "",
    },

    education: {
      type: String,
      trim: true,
      default: "",
    },

    university: {
      type: String,
      trim: true,
      default: "",
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    verifiedSkills: [
      {
        type: String,
        trim: true,
      },
    ],

    github: {
      type: String,
      trim: true,
      default: "",
    },

    linkedin: {
      type: String,
      trim: true,
      default: "",
    },

    portfolio: {
      type: String,
      trim: true,
      default: "",
    },

    certificates: {
      type: [certificateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile = mongoose.model(
  "StudentProfile",
  studentProfileSchema
);
