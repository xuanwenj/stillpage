import { Request, Response } from "express";
import Note from "../models/note.model";
import Todo from "../models/todo.model";
import BrainDump from "../models/braindump.model";
import Anthropic from "@anthropic-ai/sdk";
import { Types } from "mongoose";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const getDailyReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const date = todayString();
    const todos = await Todo.find({ userId, date });
    const notes = await Note.find({ userId, date });
    const braindump = await BrainDump.findOne({ userId, date });

    const completedTodos =
      todos.length > 0
        ? todos.filter((t) => t.completed).map((t) => t.content)
        : [];
    const uncompletedTodos =
      todos.length > 0
        ? todos.filter((t) => !t.completed).map((t) => t.content)
        : ["No todos for today."];
    const noteSummaries =
      notes.length > 0
        ? notes.map((n) => `- ${n.title}: ${n.content.slice(0, 100)}...`)
        : ["No notes for today."];
    const braindumpContent = braindump
      ? braindump.content
      : "No brain dump for today.";

    const prompt = `You are a warm and encouraging daily productivity coach. 
    Your role is to help users reflect on their day by celebrating what they accomplished, 
    acknowledging their effort, and gently surfacing what to focus on tomorrow. 
    You speak in a supportive, genuine tone — never generic or overly cheerful. 
    You recognize that even small progress is real progress.
    Use the completed todos to highlight what the user achieved today. 
    Use the notes to briefly reflect on what the user wrote or explored.
    Use the brain dump to identify distractions or unresolved thoughts, and extract action items for tomorrow.
    Include incomplete todos and items extracted from the brain dump in tomorrow's suggestions as well.
    Do not make up tasks or notes that are not provided. If data is missing, acknowledge it briefly and move on.
    Respond ONLY with a valid JSON object. No explanation, no markdown, no code blocks.
    The JSON must have exactly two fields:
        - "summary": a string
        - "tomorrowSuggestions": an array of strings, where each string is ONE single task or suggestion. Do not combine multiple tasks into one string.
   
    **Completed Todos:**
    ${completedTodos.join("\n")}

    **Incomplete Todos:**
    ${uncompletedTodos.join("\n")}

    **Notes:**
    ${noteSummaries.join("\n")}

    **Brain Dump:**
    ${braindumpContent}

`;
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleanText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleanText);
    if (typeof parsed.summary !== "string") throw new Error("Invalid response");
    if (!Array.isArray(parsed.tomorrowSuggestions))
      throw new Error("Invalid response");
    const reviewText = `Daily Review:\n${parsed.summary}\n\nTomorrow's Suggestions:\n${parsed.tomorrowSuggestions.map((s: string) => `- ${s}`).join("\n")}`;
    return res.status(200).json({ review: reviewText });
  } catch (error) {
    console.error("getDailyReview error:", error);
    return res.status(500).json({ message: "Error generating review" });
  }
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
