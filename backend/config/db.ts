import { connect } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongoUri = process.env.MONGO_URI;
async function connectMongoose() {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }
  try {
    await connect(mongoUri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

export default connectMongoose;
