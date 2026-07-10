import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client is required"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot be more than 1000 characters"],
    },

    moderationStatus: {
      type: String,
      enum: {
        values: ["visible", "hidden", "flagged"],
        message: "Moderation status must be visible, hidden, or flagged",
      },
      default: "visible",
    },

    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ project: 1 }, { unique: true });
reviewSchema.index({ student: 1, createdAt: -1 });
reviewSchema.index({ client: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

export const Review = mongoose.model("Review", reviewSchema);
