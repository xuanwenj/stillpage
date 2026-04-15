import express, { Router } from "express";
import {
  createTodo,
  getAllTodos,
  updateTodo,
  deleteTodo,
} from "../controllers/todo.controller";
import { authenticate } from "../middlewares/auth.middleware";

const todoRouter: Router = express.Router();

/**
 * All todo routes require authentication
 * Every request must include: Authorization: Bearer {token}
 */

/**
 * POST /api/todos
 * Create a new todo item
 * Body: { noteId (optional), content }
 */
todoRouter.post("/", authenticate, createTodo);

/**
 * GET /api/todos
 * Get all todo items for the user (newest first)
 * Query params: ?noteId=xxx (optional - filter by note)
 */
todoRouter.get("/", authenticate, getAllTodos);

/**
 * PUT /api/todos/:id
 * Update a todo item
 * Params: id (todo ID)
 * Body: { content (optional), completed (optional) }
 */
todoRouter.put("/:id", authenticate, updateTodo);

/**
 * DELETE /api/todos/:id
 * Delete a todo item
 * Params: id (todo ID)
 */
todoRouter.delete("/:id", authenticate, deleteTodo);

export default todoRouter;
