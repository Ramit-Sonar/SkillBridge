import mongoose from "mongoose";
import { attachmentSchema } from "../schemas/attachment.schema.js";

const jobSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    requirements: {
      type: String,
      required: true,
      trim: true,
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    budget: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: {
      type: String,
      required: true,
      trim: true,
    },

    deadline: {
      type: Date,
      required: true,
    },

    complexity: {
      type: String,
      enum: ["small", "medium"],
      required: true,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["open", "closed", "cancelled"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.pre("init", function (data) {
  if (!Array.isArray(data.attachments)) return;

  data.attachments = data.attachments
    .map((attachment) => {
      if (typeof attachment !== "string") return attachment;

      return {
        url: attachment,
        publicId: "",
        originalName: attachment,
        mimeType: "application/octet-stream",
        size: 0,
      };
    })
    .filter(Boolean);
});

export const Job = mongoose.model("Job", jobSchema);
