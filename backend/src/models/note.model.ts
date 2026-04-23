import { Schema, model, Document, Types } from "mongoose";

// Interface for TypeScript type safety
interface INote extends Document {
  userId: Types.ObjectId;
  title: string;
  content: string; // HTML from Quill
  folderId?: Types.ObjectId; // Optional - note can exist without folder
  date: string; // YYYY-MM-DD, set on creation
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// Define the schema
const noteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
      index: true, // Index for faster queries when fetching user's notes
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    content: {
      type: String,
      default: "", // Empty string when note is first created
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder", // Reference to Folder model
      default: null, // Optional
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    date: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Virtual for converting _id to id in JSON response
noteSchema.virtual("id").get(function (this: INote) {
  return this._id;
});

// Include virtuals when converting to JSON
noteSchema.set("toJSON", { virtuals: true });

// Create and export the model
const Note = model<INote>("Note", noteSchema);

export default Note;
export { INote };
