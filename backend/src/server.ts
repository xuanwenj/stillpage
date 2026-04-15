import connectMongoose from "../config/db";
import authRouter from "./routes/auth";
import noteRouter from "./routes/note";
import folderRouter from "./routes/folder";
import todoRouter from "./routes/todo";
import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:2000", "http://localhost:2001"],
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
