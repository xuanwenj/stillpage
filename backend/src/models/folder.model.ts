import { Schema, model, Document, Types } from "mongoose";

// Interface for TypeScript type safety
interface IFolder extends Document {
  userId: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const folderSchema = new Schema<IFolder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Fast query when fetching user's folders
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
  },
  {
    timestamps: true, // Auto-add createdAt and updatedAt
  },
);

// Virtual for converting _id to id in JSON response
folderSchema.virtual("id").get(function (this: IFolder) {
  return this._id;
});

// Include virtuals when converting to JSON
folderSchema.set("toJSON", { virtuals: true });

// Create and export the model
const Folder = model<IFolder>("Folder", folderSchema);

export default Folder;
export { IFolder };
