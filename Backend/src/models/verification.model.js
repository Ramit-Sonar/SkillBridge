import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    type: {
      type: String,
      enum: ["student", "client"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Student Verification
    collegeName: {
      type: String,
      trim: true,
      default: "",
    },

    studentId: {
      type: String,
      trim: true,
      default: "",
    },

    collegeIdCard: {
      type: String,
      default: "",
    },

    studentSelfie: {
      type: String,
      default: "",
    },

    // Client KYC
    legalName: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
    },

    citizenshipFront: {
      type: String,
      default: "",
    },

    citizenshipSelfie: {
      type: String,
      default: "",
    },

    companyRegistrationDocument: {
      type: String,
      default: "",
    },

    submittedAt: {
      type: Date,
    },

    verifiedAt: {
      type: Date,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Verification = mongoose.model(
  "Verification",
  verificationSchema
);
