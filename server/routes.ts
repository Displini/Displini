import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

// Request body types
interface NewsletterSubscribeRequestBody {
  email: string;
}

// Response types
interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface NewsletterResponse extends ApiResponse {
  success: boolean;
  message: string;
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.post('/api/newsletter/subscribe', async (req: Request<unknown, NewsletterResponse, NewsletterSubscribeRequestBody>, res: Response<NewsletterResponse>) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, message: "Invalid email address" } as NewsletterResponse);
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
      
      const response: NewsletterResponse = { 
        success: true, 
        message: 'Successfully subscribed to newsletter' 
      };
      res.json(response);
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to subscribe to newsletter";
      res.status(500).json({ 
        success: false,
        message: errorMessage 
      } as NewsletterResponse);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
