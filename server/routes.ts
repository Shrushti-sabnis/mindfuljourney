import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { ZodError } from "zod";
import { insertJournalSchema, insertMoodSchema, User } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import Stripe from "stripe";
import { z } from "zod";

// Helper function to get all users from storage
async function getAllUsers(): Promise<User[]> {
  // This is a workaround since we can't directly access the private users Map
  // In a real application with a database, you would use a query instead
  const users: User[] = [];
  let userId = 1;
  
  // Try to fetch users incrementally until we can't find any more
  while (true) {
    try {
      const user = await storage.getUser(userId);
      if (user) {
        users.push(user);
        userId++;
      } else {
        break;
      }
    } catch (error) {
      break;
    }
    
    // Safety check to prevent infinite loops
    if (userId > 1000) break;
  }
  
  return users;
}

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRICE_ID;
const stripeEnabled = !!stripeSecretKey && !!stripePriceId;
let stripe: Stripe | undefined;

if (stripeEnabled) {
  // Use any compatible API version
  stripe = new Stripe(stripeSecretKey!, {
    apiVersion: "2022-08-01" as any, 
  });
} else {
  console.warn("Stripe integration is disabled. Missing required environment variables.");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Error handler for Zod validation errors
  const handleZodError = (error: unknown) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return validationError.message;
    }
    return "An unexpected error occurred";
  };

  // Journal routes
  app.get("/api/journals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const journals = await storage.getJournalsByUserId(req.user!.id);
      res.json(journals);
    } catch (error) {
      console.error("Error fetching journals:", error);
      res.status(500).json({ message: "Failed to fetch journals" });
    }
  });

  app.get("/api/journals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const journal = await storage.getJournal(parseInt(req.params.id));
      
      if (!journal) {
        return res.status(404).json({ message: "Journal not found" });
      }
      
      if (journal.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to journal" });
      }
      
      res.json(journal);
    } catch (error) {
      console.error("Error fetching journal:", error);
      res.status(500).json({ message: "Failed to fetch journal" });
    }
  });

  app.post("/api/journals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const journalData = insertJournalSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const journal = await storage.createJournal(journalData);
      res.status(201).json(journal);
    } catch (error) {
      const errorMessage = handleZodError(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  app.put("/api/journals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const journalId = parseInt(req.params.id);
      const existingJournal = await storage.getJournal(journalId);
      
      if (!existingJournal) {
        return res.status(404).json({ message: "Journal not found" });
      }
      
      if (existingJournal.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized to update this journal" });
      }
      
      const journalData = insertJournalSchema.partial().parse(req.body);
      const updatedJournal = await storage.updateJournal(journalId, journalData);
      
      res.json(updatedJournal);
    } catch (error) {
      const errorMessage = handleZodError(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  app.delete("/api/journals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const journalId = parseInt(req.params.id);
      const existingJournal = await storage.getJournal(journalId);
      
      if (!existingJournal) {
        return res.status(404).json({ message: "Journal not found" });
      }
      
      if (existingJournal.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized to delete this journal" });
      }
      
      await storage.deleteJournal(journalId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting journal:", error);
      res.status(500).json({ message: "Failed to delete journal" });
    }
  });

  // Mood routes
  app.get("/api/moods", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const moods = await storage.getMoodsByUserId(req.user!.id);
      res.json(moods);
    } catch (error) {
      console.error("Error fetching moods:", error);
      res.status(500).json({ message: "Failed to fetch moods" });
    }
  });

  app.get("/api/moods/range", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const moods = await storage.getMoodsByUserIdInRange(req.user!.id, start, end);
      res.json(moods);
    } catch (error) {
      console.error("Error fetching moods by range:", error);
      res.status(500).json({ message: "Failed to fetch moods" });
    }
  });

  app.post("/api/moods", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const moodData = insertMoodSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const mood = await storage.createMood(moodData);
      res.status(201).json(mood);
    } catch (error) {
      const errorMessage = handleZodError(error);
      res.status(400).json({ message: errorMessage });
    }
  });

  // User profile routes
  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate the request body
      const userProfileSchema = z.object({
        username: z.string().min(3).max(50).optional(),
        email: z.string().email().optional(),
      });
      
      const profileData = userProfileSchema.parse(req.body);
      
      // Check that at least one field is being updated
      if (!profileData.username && !profileData.email) {
        return res.status(400).json({ message: "No fields to update" });
      }
      
      // Update the user profile
      const updatedUser = await storage.updateUserProfile(req.user!.id, profileData);
      
      // Update the user in the session
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Session update error:", err);
          return res.status(500).json({ message: "Failed to update session" });
        }
        
        // Return the updated user profile
        res.json(updatedUser);
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        const errorMessage = handleZodError(error);
        return res.status(400).json({ message: errorMessage });
      }
      
      console.error("Error updating profile:", error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });
  
  // Update user password
  app.put("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate the request body
      const passwordUpdateSchema = z.object({
        currentPassword: z.string().min(6, "Password must be at least 6 characters"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
      }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "New password and confirm password do not match",
        path: ["confirmPassword"],
      });
      
      const passwordData = passwordUpdateSchema.parse(req.body);
      
      // Update the user password
      const updatedUser = await storage.updateUserPassword(
        req.user!.id, 
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // Update the user in the session
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Session update error:", err);
          return res.status(500).json({ message: "Failed to update session" });
        }
        
        // Return success without user data to avoid returning password in response
        res.json({ message: "Password updated successfully" });
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        const errorMessage = handleZodError(error);
        return res.status(400).json({ message: errorMessage });
      }
      
      console.error("Error updating password:", error);
      res.status(400).json({ message: error.message || "Failed to update password" });
    }
  });

  // Mindfulness session routes
  app.get("/api/mindfulness", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const includePremium = req.user!.isPremium;
      const sessions = await storage.getMindfulnessSessions(includePremium);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching mindfulness sessions:", error);
      res.status(500).json({ message: "Failed to fetch mindfulness sessions" });
    }
  });

  app.get("/api/mindfulness/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const session = await storage.getMindfulnessSession(parseInt(req.params.id));
      
      if (!session) {
        return res.status(404).json({ message: "Mindfulness session not found" });
      }
      
      if (session.isPremium && !req.user!.isPremium) {
        return res.status(403).json({ message: "Premium subscription required" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching mindfulness session:", error);
      res.status(500).json({ message: "Failed to fetch mindfulness session" });
    }
  });

  // Simple premium activation without Stripe
  app.post("/api/premium/activate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = req.user!;
      
      // Directly update user to premium status
      const updatedUser = await storage.updateUserPremium(user.id, true);
      
      // Update the session with the new user data
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Session update error:", err);
          return res.status(500).json({ message: "Failed to update session" });
        }
        
        // Return success message
        res.json({
          success: true,
          message: "Premium activation successful",
        });
      });
    } catch (error: any) {
      console.error("Premium activation error:", error);
      res.status(400).json({ message: error.message || "Failed to activate premium" });
    }
  });
  
  // Stripe subscription routes (keeping the endpoint for compatibility but using our simplified approach)
  if (stripeEnabled && stripe) {
    app.post("/api/create-subscription", async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      try {
        const user = req.user!;
        
        // Instead of using Stripe, directly mark the user as premium
        const updatedUser = await storage.updateUserPremium(user.id, true);
        
        // Update the session with the new user data
        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Session update error:", err);
            return res.status(500).json({ message: "Failed to update session" });
          }
          
          // Return a simplified success response
          res.json({
            success: true,
            message: "Premium activated successfully",
          });
        });
      } catch (error: any) {
        console.error("Subscription error:", error);
        res.status(400).json({ message: error.message || "Failed to activate premium" });
      }
    });
    
    // Webhook to handle Stripe events
    app.post("/api/webhook", async (req, res) => {
      // For development, we'll skip signature verification and directly update the user
      // In production, you would use the Stripe signature to verify the webhook
      
      // Parse the raw body
      let event;
      
      try {
        if (req.body.type && req.body.data) {
          // Already parsed JSON
          event = req.body;
        } else {
          // Raw request body, needs to be parsed
          event = JSON.parse(req.body);
        }
      } catch (err: any) {
        console.error("Failed to parse webhook body:", err.message);
        return res.status(400).json({ message: "Invalid request payload" });
      }
      
      console.log("Received webhook event:", event.type);
      
      // Handle various Stripe events
      switch(event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log("PaymentIntent succeeded:", paymentIntent.id);
          break;
        }
        
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log("PaymentIntent failed:", paymentIntent.id);
          break;
        }
          
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log("Subscription created:", subscription.id);
          break;
        }
          
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log("Subscription updated:", subscription.id, "Status:", subscription.status);
          
          if (subscription.status === 'active') {
            // For this in-memory implementation, we need to manually find users with matching subscription IDs
            // In a real DB implementation, you'd query the database directly
            const allUsers = await getAllUsers();
            const user = allUsers.find(u => u.stripeSubscriptionId === subscription.id);
            
            if (user) {
              await storage.updateUserPremium(user.id, true);
              console.log(`User ${user.id} (${user.username}) is now a premium user`);
            } else {
              console.log("No user found with subscription ID:", subscription.id);
            }
          }
          break;
        }
          
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log("Subscription deleted:", subscription.id);
          
          // Find user by subscription ID and update premium status
          const allUsers = await getAllUsers();
          const user = allUsers.find(u => u.stripeSubscriptionId === subscription.id);
          
          if (user) {
            await storage.updateUserPremium(user.id, false);
            console.log(`User ${user.id} (${user.username}) is no longer a premium user`);
          }
          break;
        }
      }
      
      // Return a 200 response to acknowledge receipt of the event
      res.json({ received: true });
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
