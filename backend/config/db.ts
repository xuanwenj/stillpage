import { Schema, model, connect } from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();

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

// Create a Model.
const User = model("User", userSchema);

run().catch((err) => console.log(err));

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }
  await connect(mongoUri);
  console.log("Connected to MongoDB");

  // Hash password before saving
  const hashedPassword = await bcrypt.hash("passworda123", 10);

  const user = new User({
    name: "Dell",
    email: "tdiii@initech.com",
    password: hashedPassword,
  });
  await user.save();

  console.log("User created successfully:", user.email);
}
