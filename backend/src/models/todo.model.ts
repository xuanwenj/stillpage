import { Schema, model, Document, Types } from "mongoose";

// Interface for TypeScript type safety
interface ITodo extends Document {
  noteId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  completed: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const todoSchema = new Schema<ITodo>(
  {
    noteId: {
      type: Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    completed: {
      type: Boolean,
      default: false,
      archived: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for converting _id to id in JSON response
todoSchema.virtual("id").get(function (this: ITodo) {
  return this._id;
});

// Include virtuals when converting to JSON
todoSchema.set("toJSON", { virtuals: true });

// Create and export the model
const Todo = model<ITodo>("Todo", todoSchema);

export default Todo;
export { ITodo };
