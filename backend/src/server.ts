import connectMongoose from "../config/db";
import authRouter from "./routes/auth";
import noteRouter from "./routes/note";
import folderRouter from "./routes/folder";
import todoRouter from "./routes/todo";
import brainDumpRouter from "./routes/braindump";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : [
          "http://localhost:2000",
          "http://localhost:2001",
          "http://localhost:2002",
          "chrome-extension://bddpaochjacomkcbmihigelnaphnkocc",
        ],
    credentials: true,
  }),
);
app.use(express.json());

// Test route
app.get("/", (req: any, res: any) => {
  res.json({ message: "Server is running!" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/notes", noteRouter);
app.use("/api/folders", folderRouter);
app.use("/api/todos", todoRouter);
app.use("/api/braindump", brainDumpRouter);

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
