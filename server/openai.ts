import OpenAI from "openai";

export interface ParsedCommand {
  type: "meal" | "workout" | "medication" | "task" | "calendar" | "unknown";
  data?: {
    name?: string;
    emoji?: string;
    protein?: number;
    carbs?: number;
    fat?: number;
    duration?: number;
    workoutType?: string;
    time?: string;
    date?: string;
    frequency?: string;
    days?: string[];
  };
  message?: string;
}

// ✅ Allow local dev without a key
const AI_DISABLED =
  process.env.OPENAI_DISABLED === "true" || !process.env.OPENAI_API_KEY;

export const openai = AI_DISABLED
  ? null
  : new OpenAI({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      apiKey: process.env.OPENAI_API_KEY!,
    });

export async function parseUserCommand(userInput: string): Promise<ParsedCommand> {
  // Fast path for local dev with no key
  if (AI_DISABLED) {
    return {
      type: "unknown",
      message:
        "AI is disabled in dev (set OPENAI_API_KEY or toggle OPENAI_DISABLED=false). Use manual entry for now.",
    };
  }

  try {
    const response = await openai!.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a health and fitness assistant. Parse user commands into structured data for logging meals, workouts, medications, tasks, or calendar events.

Respond with JSON in this exact format:
{
  "type": "meal" | "workout" | "medication" | "task" | "calendar" | "unknown",
  "data": {
    "name": "string (item name)",
    "emoji": "string (appropriate emoji)",
    "protein": number (grams, for meals),
    "carbs": number (grams, for meals),
    "fat": number (grams, for meals),
    "duration": number (minutes, for workouts),
    "workoutType": "cardio" | "strength" | "flexibility" | "sports" (for workouts),
    "time": "HH:MM" (24-hour format),
    "date": "YYYY-MM-DD" (if specified, otherwise today),
    "frequency": "daily" | "weekly" | "biweekly" (for recurring items),
    "days": ["monday", "tuesday", ...] (for weekly items)
  },
  "message": "string (confirmation message to show user)"
}

Make reasonable estimates for nutrition if not specified. Use context clues for meal times (breakfast ~08:00, lunch ~12:30, dinner ~19:00).`,
        },
        { role: "user", content: userInput },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(raw) as ParsedCommand;
  } catch (error: any) {
    console.error("OpenAI parsing error:", error);

    if (error?.status === 429 || error?.code === "insufficient_quota") {
      return {
        type: "unknown",
        message:
          "AI service temporarily unavailable due to rate limits. Please use manual entry or try again later.",
      };
    }

    return {
      type: "unknown",
      message:
        "Sorry, I couldn't understand that. Try something like 'log chicken salad for lunch' or 'schedule a 30 min run tomorrow'.",
    };
  }
}

export async function generateText(prompt: string): Promise<string> {
  // Fast path for local dev with no key
  if (AI_DISABLED) {
    return "AI story generation is disabled (set OPENAI_API_KEY to enable). Your journal entry has been saved.";
  }

  try {
    const response = await openai!.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a creative writer who transforms journal entries into beautiful, inspiring stories. Write in an engaging, narrative style that captures emotions and meaningful moments."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || "Unable to generate story at this time.";
  } catch (error: any) {
    console.error("OpenAI text generation error:", error);
    
    if (error?.status === 429 || error?.code === "insufficient_quota") {
      return "AI service temporarily unavailable. Your journal entry has been saved.";
    }

    return "Unable to generate story at this time. Your journal entry has been saved.";
  }
}