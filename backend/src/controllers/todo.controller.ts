import { DateTime } from "luxon";
import { Request, Response, NextFunction } from "express";
import Todo, { ITodo } from "../models/todo.model";
import { Types } from "mongoose";
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

    const { noteId, content } = req.body;
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

    // Create todo
    const todo = new Todo({
      noteId,
      userId,
      content: content.trim(),
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
    const { content, completed } = req.body;

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
    if (completed !== undefined) {
      todo.completed = completed;
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

export const getWeeklyStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Get timezone from query parameter
    const timezone = req.query.timezone as string;
    if (!timezone) {
      return res.status(400).json({ error: "Timezone is required" });
    }

    // 2. Get user ID from authentication middleware
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // 3. Get current time in user's timezone
    const now = DateTime.now().setZone(timezone);

    // 4. Always find the most recent Monday 00:00 in user's timezone
    const weekStart = now.minus({ days: now.weekday - 1 }).startOf("day");
    // 5. Always find the upcoming Sunday 23:59:59 in user's timezone
    const weekEnd = weekStart.plus({ days: 6 }).endOf("day");

    // 6. Convert to UTC for MongoDB query
    const startUTC = weekStart.toUTC().toJSDate();
    const endUTC = weekEnd.toUTC().toJSDate();

    // 7. Query todos for this user in this week
    const todos = await Todo.find({
      userId: userId,
      createdAt: { $gte: startUTC, $lte: endUTC },
    });

    // 8. Optionally, build a summary (total, completed, etc.)
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    console.log("weekStart:", weekStart.toString());
    console.log("weekEnd:", weekEnd.toString());
    console.log("todos found:", todos.length);
    res.json({
      total,
      completed,
      rate,
      todos,
    });
  } catch (error) {
    res.status(500).json({
      error: "Server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
