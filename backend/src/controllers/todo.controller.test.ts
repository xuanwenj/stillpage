import { Request, Response, NextFunction } from "express";
import {
  createTodo,
  deleteTodo,
  updateTodo,
  getAllTodos,
} from "./todo.controller";
import Todo from "../models/todo.model";
import Note from "../models/note.model";
import { DateTime } from "luxon";

jest.mock("../models/todo.model");
jest.mock("../models/note.model");
jest.mock("luxon");

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

describe("todo.controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: "user-123",
        email: "user@example.com",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn() as NextFunction;
    jest.clearAllMocks();
  });

  describe("createTodo", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;

      await createTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 404 if note does not exist", async () => {
      req.body = { noteId: "note-123", content: "Test todo" };
      (Note.findById as jest.Mock).mockResolvedValue(null);

      await createTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Note not found" });
    });

    it("should return 403 if note does not belong to user", async () => {
      const mockNote = { userId: "other-user" };
      req.body = { noteId: "note-123", content: "Test todo" };
      (Note.findById as jest.Mock).mockResolvedValue(mockNote);

      await createTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: Note does not belong to user",
      });
    });

    it("should return 400 if content is empty", async () => {
      req.body = { content: "   " };

      await createTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Content is required",
      });
    });

    it("should create a todo and return 201", async () => {
      const mockTodo = {
        _id: "todo-123",
        content: "Test todo",
        userId: "user-123",
        completed: false,
      };
      req.body = { content: "Test todo" };
      (Todo as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined),
        ...mockTodo,
      }));

      const todoInstance = new Todo(mockTodo);
      (todoInstance.save as jest.Mock).mockResolvedValue(undefined);

      await createTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Todo item created successfully",
        }),
      );
    });

    it("should handle errors during creation", async () => {
      req.body = { content: "Test todo" };
      const mockTodo = {
        save: jest.fn().mockRejectedValue(new Error("Database error")),
      };
      (Todo as any).mockImplementation(() => mockTodo);

      await createTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error creating todo item",
          error: "Database error",
        }),
      );
    });
  });

  describe("deleteTodo", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;

      await deleteTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 404 if todo does not exist", async () => {
      req.params = { id: "todo-123" };
      (Todo.findById as jest.Mock).mockResolvedValue(null);

      await deleteTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Todo item not found",
      });
    });

    it("should return 403 if todo does not belong to user", async () => {
      const mockTodo = { userId: "other-user" };
      req.params = { id: "todo-123" };
      (Todo.findById as jest.Mock).mockResolvedValue(mockTodo);

      await deleteTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Forbidden: Todo item does not belong to user",
      });
    });

    it("should delete todo and return success", async () => {
      const mockTodo = {
        userId: "user-123",
        deleteOne: jest.fn().mockResolvedValue(undefined),
      };
      req.params = { id: "todo-123" };
      (Todo.findById as jest.Mock).mockResolvedValue(mockTodo);

      await deleteTodo(req as AuthRequest, res as Response, next);

      expect(mockTodo.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Todo item deleted successfully",
      });
    });

    it("should handle errors during deletion", async () => {
      const error = new Error("Delete error");
      (Todo.findById as jest.Mock).mockRejectedValue(error);
      req.params = { id: "todo-123" };

      await deleteTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error deleting todo item",
          error: "Delete error",
        }),
      );
    });
  });

  describe("updateTodo", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;

      await updateTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 404 if todo does not exist", async () => {
      req.params = { id: "todo-123" };
      (Todo.findById as jest.Mock).mockResolvedValue(null);

      await updateTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Todo item not found",
      });
    });

    it("should return 403 if todo does not belong to user", async () => {
      const mockTodo = { userId: "other-user" };
      req.params = { id: "todo-123" };
      (Todo.findById as jest.Mock).mockResolvedValue(mockTodo);

      await updateTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should return 400 if content is empty", async () => {
      const mockTodo = {
        userId: "user-123",
        content: "Test",
        completed: false,
      };
      req.params = { id: "todo-123" };
      req.body = { content: "   " };
      (Todo.findById as jest.Mock).mockResolvedValue(mockTodo);

      await updateTodo(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Content cannot be empty",
      });
    });

    it("should update todo content", async () => {
      const mockTodo = {
        userId: "user-123",
        content: "Old content",
        save: jest.fn().mockResolvedValue(undefined),
      };
      req.params = { id: "todo-123" };
      req.body = { content: "New content" };
      (Todo.findById as jest.Mock).mockResolvedValue(mockTodo);

      await updateTodo(req as AuthRequest, res as Response, next);

      expect(mockTodo.content).toBe("New content");
      expect(mockTodo.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Todo item updated successfully",
        todo: mockTodo,
      });
    });
  });

  describe("getAllTodos", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;

      await getAllTodos(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return all todos for user", async () => {
      const mockTodos = [
        { _id: "todo-1", content: "Todo 1" },
        { _id: "todo-2", content: "Todo 2" },
      ];
      (Todo.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTodos),
      });

      await getAllTodos(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Todos retrieved successfully",
        count: 2,
        todos: mockTodos,
      });
    });

    it("should handle errors when fetching todos", async () => {
      const error = new Error("Fetch error");
      (Todo.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(error),
      });

      await getAllTodos(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error fetching todos",
          error: "Fetch error",
        }),
      );
    });
  });
});
