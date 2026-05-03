import { Request, Response } from "express";
import Note from "../models/note.model";
import Todo from "../models/todo.model";
import BrainDump from "../models/braindump.model";
import DailyReview from "../models/dailyreview.model";
import weekreviewModel from "../models/weekreview.model";
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
    const [todos, notes, braindump] = await Promise.all([
      Todo.find({ userId, date }),
      Note.find({ userId, date }),
      BrainDump.findOne({ userId, date }),
    ]);

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

    const tomorrow = tomorrowString();
    const userObjectId = new Types.ObjectId(userId);

    // Save daily summary to DailyReview collection
    await DailyReview.findOneAndUpdate(
      { userId: userObjectId, date },
      { summary: parsed.summary },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    // Save AI suggestions as new todos with tomorrow's date
    if (parsed.tomorrowSuggestions.length > 0) {
      await Todo.insertMany(
        parsed.tomorrowSuggestions.map((content: string) => ({
          userId: userObjectId,
          content,
          date: tomorrow,
          completed: false,
          archived: false,
        })),
      );
    }

    // Bump today's unfinished todos to tomorrow
    await Todo.updateMany(
      { userId: userObjectId, date, completed: false },
      { date: tomorrow },
    );

    return res.status(200).json({
      summary: parsed.summary,
      tomorrowSuggestions: parsed.tomorrowSuggestions,
    });
  } catch (error) {
    console.error("getDailyReview error:", error);
    return res.status(500).json({ message: "Error generating review" });
  }
};

export const getWeeklyReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const userObjectId = new Types.ObjectId(userId);

    const dailyReviews = await DailyReview.find({
      userId: userObjectId,
      date: { $gte: weekStart, $lte: weekEnd },
    }).sort({ date: 1 });

    if (dailyReviews.length === 0) {
      return res.status(200).json({
        summary: null,
        message: "No daily reviews found for this week.",
      });
    }

    // TODO: build prompt and call Claude
    const summaries = dailyReviews
      .map((dr) => `-${dr.date}: ${dr.summary}`)
      .join("\n");
    const promt = `You are a thoughtful personal productivity companion writing a warm, encouraging weekly review letter.

You will be given the user's daily reviews for the past week. Your job is to reflect on the week at a high level — not to count tasks or list specifics, but to identify the broader themes of what the user spent their energy on.

Guidelines:
- Group the completed todos into natural categories (e.g. project work, learning, life admin, job search, etc.) based on their content. Only include categories that are actually present.
- Reflect on each category briefly — what kind of work it represents, the effort behind it.
- Keep the tone warm, encouraging, and human. This is a letter to a friend, not a report.
- End with a short, genuine closing that acknowledges the week as a whole and gently looks forward to the next.
- Do NOT list individual tasks or give counts like "you completed 5 todos". Stay at the thematic level.
- Write in a natural, conversational style. Avoid corporate or robotic language.
- Length: around 200–300 words.

Here is the user's data for this week:
  Daily reviews: ${summaries}
  
  Write the weekly review letter now, and respond ONLY with the letter text. Do not include any explanations, formatting, or markdown.`;
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: promt }],
    });

    const summary =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    await weekreviewModel.findOneAndUpdate(
      { userId: userObjectId, weekStart, weekEnd },
      { summary },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    console.log("Generated weekly review:", summary);
    return res.status(200).json({ summary });
  } catch (error) {
    console.error("getWeeklyReview error:", error);
    return res.status(500).json({ message: "Error generating weekly review" });
  }
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWeekStart(): string {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);
  return monday.toISOString().slice(0, 10);
}

function getWeekEnd(): string {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + (6 - dayOfWeek));
  return sunday.toISOString().slice(0, 10);
}

function tomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
