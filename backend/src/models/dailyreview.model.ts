import { Schema, model, Document, Types } from "mongoose";

export interface IDailyReview extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const dailyReviewSchema = new Schema<IDailyReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
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

// One review per user per day
dailyReviewSchema.index({ userId: 1, date: 1 }, { unique: true });

export default model<IDailyReview>("DailyReview", dailyReviewSchema);
