import { Request, Response } from "express";
import Note from "../models/note.model";
import Todo from "../models/todo.model";
import BrainDump from "../models/braindump.model";
import DailyReview from "../models/dailyreview.model";
import weekreviewModel from "../models/weekreview.model";
import Anthropic from "@anthropic-ai/sdk";
import { Types } from "mongoose";

jest.mock("../models/note.model");
jest.mock("../models/todo.model");
jest.mock("../models/braindump.model");
jest.mock("../models/dailyreview.model");
jest.mock("../models/weekreview.model");

// Mock Anthropic before importing the controller
const mockCreate = jest.fn();
jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn(() => ({
    messages: {
      create: mockCreate,
    },
  }));
});

// Import controller after mocking
import { getDailyReview, getWeeklyReview } from "./review.controller";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

describe("review.controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: {
        userId: "507f1f77bcf86cd799439011",
        email: "user@example.com",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe("getDailyReview", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;
      await getDailyReview(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should fetch todos, notes, and braindump for today", async () => {
      const mockTodos = [
        { content: "Task 1", completed: true },
        { content: "Task 2", completed: false },
      ];
      const mockNotes = [{ title: "Note 1", content: "Note content here" }];
      const mockBraindump = { content: "Brain dump content" };

      (Todo.find as jest.Mock).mockResolvedValue(mockTodos);
      (Note.find as jest.Mock).mockResolvedValue(mockNotes);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(mockBraindump);

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Great day!",
              tomorrowSuggestions: ["Task 3", "Task 4"],
            }),
          },
        ],
      });

      (DailyReview.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (Todo.insertMany as jest.Mock).mockResolvedValue([]);
      (Todo.updateMany as jest.Mock).mockResolvedValue({});

      await getDailyReview(req as AuthRequest, res as Response);

      expect(Todo.find).toHaveBeenCalledWith({
        userId: req.user?.userId,
        date: expect.any(String),
      });
      expect(Note.find).toHaveBeenCalledWith({
        userId: req.user?.userId,
        date: expect.any(String),
      });
      expect(BrainDump.findOne).toHaveBeenCalledWith({
        userId: req.user?.userId,
        date: expect.any(String),
      });
    });

    it("should call Anthropic API with correct prompt", async () => {
      const mockTodos = [{ content: "Task 1", completed: true }];
      const mockNotes = [{ title: "Note 1", content: "Content" }];

      (Todo.find as jest.Mock).mockResolvedValue(mockTodos);
      (Note.find as jest.Mock).mockResolvedValue(mockNotes);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Good work today",
              tomorrowSuggestions: ["New task"],
            }),
          },
        ],
      });

      (DailyReview.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (Todo.insertMany as jest.Mock).mockResolvedValue([]);
      (Todo.updateMany as jest.Mock).mockResolvedValue({});

      await getDailyReview(req as AuthRequest, res as Response);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("warm and encouraging"),
            }),
          ],
        })
      );
    });

    it("should parse JSON response correctly", async () => {
      const mockTodos: any[] = [];
      const mockNotes: any[] = [];

      (Todo.find as jest.Mock).mockResolvedValue(mockTodos);
      (Note.find as jest.Mock).mockResolvedValue(mockNotes);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      const mockResponse = {
        summary: "Excellent day!",
        tomorrowSuggestions: ["Task A", "Task B", "Task C"],
      };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockResponse),
          },
        ],
      });

      (DailyReview.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (Todo.insertMany as jest.Mock).mockResolvedValue([]);
      (Todo.updateMany as jest.Mock).mockResolvedValue({});

      await getDailyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: "Excellent day!",
          tomorrowSuggestions: ["Task A", "Task B", "Task C"],
        })
      );
    });

    it("should handle JSON response with markdown code blocks", async () => {
      (Todo.find as jest.Mock).mockResolvedValue([]);
      (Note.find as jest.Mock).mockResolvedValue([]);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '```json\n{"summary":"Test","tomorrowSuggestions":["Task"]}\n```',
          },
        ],
      });

      (DailyReview.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (Todo.insertMany as jest.Mock).mockResolvedValue([]);
      (Todo.updateMany as jest.Mock).mockResolvedValue({});

      await getDailyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: "Test",
          tomorrowSuggestions: ["Task"],
        })
      );
    });

    it("should save daily review to database", async () => {
      const mockTodos: any[] = [];
      (Todo.find as jest.Mock).mockResolvedValue(mockTodos);
      (Note.find as jest.Mock).mockResolvedValue([]);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Day summary",
              tomorrowSuggestions: [],
            }),
          },
        ],
      });

      (DailyReview.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (Todo.insertMany as jest.Mock).mockResolvedValue([]);
      (Todo.updateMany as jest.Mock).mockResolvedValue({});

      await getDailyReview(req as AuthRequest, res as Response);

      expect(DailyReview.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          date: expect.any(String),
        }),
        { summary: "Day summary" },
        expect.objectContaining({
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        })
      );
    });

    it("should insert AI suggestions as new todos for tomorrow", async () => {
      (Todo.find as jest.Mock).mockResolvedValue([]);
      (Note.find as jest.Mock).mockResolvedValue([]);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      const suggestions = ["Task A", "Task B"];
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Good",
              tomorrowSuggestions: suggestions,
            }),
          },
        ],
      });

      (DailyReview.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (Todo.insertMany as jest.Mock).mockResolvedValue([]);
      (Todo.updateMany as jest.Mock).mockResolvedValue({});

      await getDailyReview(req as AuthRequest, res as Response);

      expect(Todo.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: expect.any(Types.ObjectId),
            content: "Task A",
            date: expect.any(String),
            completed: false,
            archived: false,
          }),
          expect.objectContaining({
            userId: expect.any(Types.ObjectId),
            content: "Task B",
            date: expect.any(String),
            completed: false,
            archived: false,
          }),
        ])
      );
    });

    it("should bump incomplete todos to tomorrow", async () => {
      const incompleteTodos = [
        { content: "Incomplete 1", completed: false },
        { content: "Incomplete 2", completed: false },
      ];
      (Todo.find as jest.Mock).mockResolvedValue(incompleteTodos);
      (Note.find as jest.Mock).mockResolvedValue([]);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Review",
              tomorrowSuggestions: [],
            }),
          },
        ],
      });

      (DailyReview.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (Todo.insertMany as jest.Mock).mockResolvedValue([]);
      (Todo.updateMany as jest.Mock).mockResolvedValue({});

      await getDailyReview(req as AuthRequest, res as Response);

      expect(Todo.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          date: expect.any(String),
          completed: false,
        }),
        { date: expect.any(String) }
      );
    });

    it("should return 500 on invalid AI response", async () => {
      (Todo.find as jest.Mock).mockResolvedValue([]);
      (Note.find as jest.Mock).mockResolvedValue([]);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Valid",
              tomorrowSuggestions: "NOT_AN_ARRAY", // Invalid: should be array
            }),
          },
        ],
      });

      await getDailyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error generating review",
      });
    });

    it("should return 500 on API error", async () => {
      (Todo.find as jest.Mock).mockResolvedValue([]);
      (Note.find as jest.Mock).mockResolvedValue([]);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      mockCreate.mockRejectedValue(new Error("API error"));

      await getDailyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error generating review",
      });
    });

    it("should handle empty todos, notes, and braindump", async () => {
      (Todo.find as jest.Mock).mockResolvedValue([]);
      (Note.find as jest.Mock).mockResolvedValue([]);
      (BrainDump.findOne as jest.Mock).mockResolvedValue(null);

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "No data",
              tomorrowSuggestions: [],
            }),
          },
        ],
      });

      (DailyReview.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (Todo.insertMany as jest.Mock).mockResolvedValue([]);
      (Todo.updateMany as jest.Mock).mockResolvedValue({});

      await getDailyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getWeeklyReview", () => {
    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;
      await getWeeklyReview(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return message if no daily reviews found", async () => {
      (DailyReview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await getWeeklyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        summary: null,
        message: "No daily reviews found for this week.",
      });
    });

    it("should fetch daily reviews for the week", async () => {
      const mockReviews = [
        { date: "2025-01-01", summary: "Day 1 review" },
        { date: "2025-01-02", summary: "Day 2 review" },
      ];

      (DailyReview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReviews),
      });

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: "Weekly summary letter",
          },
        ],
      });

      (weekreviewModel.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await getWeeklyReview(req as AuthRequest, res as Response);

      expect(DailyReview.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          date: expect.objectContaining({
            $gte: expect.any(String),
            $lte: expect.any(String),
          }),
        })
      );
      expect(DailyReview.find().sort).toHaveBeenCalledWith({ date: 1 });
    });

    it("should call Anthropic API with daily review summaries", async () => {
      const mockReviews = [
        { date: "2025-01-01", summary: "Completed tasks" },
        { date: "2025-01-02", summary: "Good progress" },
      ];

      (DailyReview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReviews),
      });

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: "Weekly summary",
          },
        ],
      });

      (weekreviewModel.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await getWeeklyReview(req as AuthRequest, res as Response);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("weekly review letter"),
            }),
          ],
        })
      );
    });

    it("should save weekly review to database", async () => {
      const mockReviews = [{ date: "2025-01-01", summary: "Day review" }];

      (DailyReview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReviews),
      });

      const weeklyText = "This week was productive";
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: weeklyText,
          },
        ],
      });

      (weekreviewModel.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await getWeeklyReview(req as AuthRequest, res as Response);

      expect(weekreviewModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          weekStart: expect.any(String),
          weekEnd: expect.any(String),
        }),
        { summary: weeklyText },
        expect.objectContaining({
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        })
      );
    });

    it("should return 200 with weekly summary", async () => {
      const mockReviews = [{ date: "2025-01-01", summary: "Review" }];

      (DailyReview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReviews),
      });

      const summary = "This week you accomplished great things";
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: summary,
          },
        ],
      });

      (weekreviewModel.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await getWeeklyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ summary });
    });

    it("should return 500 on API error", async () => {
      const mockReviews = [{ date: "2025-01-01", summary: "Review" }];

      (DailyReview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReviews),
      });

      mockCreate.mockRejectedValue(new Error("API error"));

      await getWeeklyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error generating weekly review",
      });
    });

    it("should handle non-text responses from API", async () => {
      const mockReviews = [{ date: "2025-01-01", summary: "Review" }];

      (DailyReview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReviews),
      });

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "image",
            // Non-text content
          },
        ],
      });

      (weekreviewModel.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await getWeeklyReview(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ summary: "" });
    });
  });
});
