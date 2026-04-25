import { Schema, model, Document, Types } from "mongoose";

export interface IWeekReview extends Document {
  userId: Types.ObjectId;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const weekReviewSchema = new Schema<IWeekReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStart: {
      type: String,
      required: true,
    },
    weekEnd: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// One review per user per week
weekReviewSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default model<IWeekReview>("WeekReview", weekReviewSchema);
