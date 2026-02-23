import connectMongoose from "../config/db";
import authRouter from "./routes/auth";
import express from "express";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Test route
app.get("/", (req: any, res: any) => {
  res.json({ message: "Server is running!" });
});

// Routes
app.use("/api/auth", authRouter);

// Start server
const start = async () => {
  try {
    await connectMongoose();
    app.listen(PORT, () => {
      console.log(`✓ Server Connected to port ${PORT}`);
    });
  } catch (error: any) {
    console.error("✗ Server Error:", error.message);
    process.exit(1);
  }
};

start();
