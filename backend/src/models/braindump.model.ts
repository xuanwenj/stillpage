import { Schema, model, Document, Types } from "mongoose";

export interface IBrainDump extends Document {
  userId: Types.ObjectId;
  content: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const brainDumpSchema = new Schema<IBrainDump>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// One entry per user per day
brainDumpSchema.index({ userId: 1, date: 1 }, { unique: true });

export default model<IBrainDump>("BrainDump", brainDumpSchema);
