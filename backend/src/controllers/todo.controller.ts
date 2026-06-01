import { DateTime } from "luxon";
import { Request, Response, NextFunction } from "express";
import Todo, { ITodo } from "../models/todo.model";
import Note from "../models/note.model";

// Extended Request to include user from auth middleware
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Create a new todo item for a note
 * POST /api/todos
 */
export const createTodo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { noteId, content, status } = req.body;
    if (noteId) {
      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      } else if (note.userId.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "Forbidden: Note does not belong to user" });
      }
    }
    // Validation
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Content is required" });
    }
    if (!status || (status !== "today" && status !== "upcoming")) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Create todo
    const todo = new Todo({
      noteId,
      userId,
      content: content.trim(),
      status,
      date: new Date().toISOString().slice(0, 10),
    });

    await todo.save();

    res.status(201).json({
      message: "Todo item created successfully",
      todo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating todo item",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const deleteTodo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "Todo item not found" });
    }
    if (todo.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: Todo item does not belong to user" });
    }

    await todo.deleteOne();

    res.json({ message: "Todo item deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting todo item",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const updateTodo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { content, status } = req.body;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "Todo item not found" });
    }
    if (todo.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: Todo item does not belong to user" });
    }

    if (content !== undefined) {
      if (content.trim() === "") {
        return res.status(400).json({ message: "Content cannot be empty" });
      }
      todo.content = content.trim();
    }

    if (status !== undefined) {
      if (status !== "today" && status !== "upcoming") {
        return res.status(400).json({ message: "Invalid status" });
      }
      todo.status = status;
    }

    await todo.save();

    res.json({
      message: "Todo item updated successfully",
      todo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating todo item",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get all todos for the user (active todos only)
 * GET /api/todos
 */
export const getAllTodos = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const timezone = (req.query.timezone as string) || "UTC";
    const today = DateTime.now().setZone(timezone).toISODate()!;

    // Promote past-pending todos (incomplete, date < today) to today
    await Todo.updateMany(
      { userId, archived: false, completed: false, date: { $lt: today } },
      { $set: { date: today } },
    );

    const todos = await Todo.find({ userId, archived: false }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Todos retrieved successfully",
      count: todos.length,
      todos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching todos",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
