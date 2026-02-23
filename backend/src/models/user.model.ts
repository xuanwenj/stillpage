import { Schema, model, Document } from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { IUser } from "../types/user";
dotenv.config();

interface IUserDocument extends Document, IUser {}

// Create a user schema
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook: encrypt password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error: any) {}
});

// Method: compare password
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create a Model.
const User = model<IUserDocument>("User", userSchema);

export default User;
