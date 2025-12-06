import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseUserCommand } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {

  app.get('/api/auth/user', async (_req: any, res) => {
    try {
      const userId = "dev-user";
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/user/profile', async (req: any, res) => {
    try {
      const userId = "dev-user";
      const { dateOfBirth } = req.body;
      
      if (dateOfBirth) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateOfBirth)) {
          return res.status(400).json({ message: "Invalid date format. Expected YYYY-MM-DD" });
        }
        
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid date value" });
        }
      }
      
      const user = await storage.updateUserProfile(userId, { dateOfBirth });
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/ai/generate-story', async (req: any, res) => {
    try {
      const { content, prompt, mood, tags } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Invalid content" });
      }

      const storyPrompt = `Based on this journal entry, create a beautiful, narrative story in third person that captures the essence of the day. Make it inspiring and reflective.

Journal Entry:
${content}

${prompt ? `Prompt: ${prompt}` : ''}
${mood ? `Mood: ${mood}/10` : ''}
${tags && tags.length > 0 ? `Tags: ${tags.join(', ')}` : ''}

Write a short, beautiful story (2-3 paragraphs) that transforms this entry into a compelling narrative.`;

      const { generateText } = await import('./openai');
      const story = await generateText(storyPrompt);
      
      res.json({ story });
    } catch (error) {
      console.error("Error generating AI story:", error);
      res.status(500).json({ message: "Failed to generate story" });
    }
  });

  app.post('/api/ai/parse', async (req: any, res) => {
    try {
      const { input } = req.body;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      const result = await parseUserCommand(input);
      res.json(result);
    } catch (error) {
      console.error("Error parsing command:", error);
      res.status(500).json({ message: "Failed to parse command" });
    }
  });

  app.post('/api/newsletter/subscribe', async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      // TODO: Integrate with Mailchimp API
      // For now, just log and return success
      // You can add Mailchimp integration here:
      // const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
      // const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
      // const MAILCHIMP_SERVER = process.env.MAILCHIMP_SERVER || 'us1';
      // 
      // const response = await fetch(
      //   `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       email_address: email,
      //       status: 'subscribed',
      //     }),
      //   }
      // );
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.detail || 'Subscription failed');
      // }

      console.log('Newsletter subscription:', email);
      
      res.json({ 
        success: true, 
        message: 'Successfully subscribed to newsletter' 
      });
    } catch (error: any) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ 
        message: error.message || "Failed to subscribe to newsletter" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
