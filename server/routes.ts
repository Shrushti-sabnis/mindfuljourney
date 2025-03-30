import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { ZodError } from "zod";
import { insertJournalSchema, insertMoodSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import Stripe from "stripe";

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripeEnabled = !!stripeSecretKey;
let stripe: Stripe | undefined;

if (stripeEnabled) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });
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

  // Stripe subscription routes
  if (stripeEnabled && stripe) {
    app.post("/api/create-subscription", async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      try {
        const user = req.user!;
        
        // Check if user already has a subscription
        if (user.stripeSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
          });
          
          return;
        }
        
        if (!user.email) {
          return res.status(400).json({ message: "User email is required" });
        }
        
        // Create a new customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        
        // Price ID should be set in environment variables
        const priceId = process.env.STRIPE_PRICE_ID;
        
        if (!priceId) {
          return res.status(500).json({ message: "Stripe price ID is not configured" });
        }
        
        // Create the subscription
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });
        
        // Update user with Stripe customer ID and subscription ID
        await storage.updateUserStripeInfo(user.id, {
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
        });
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        console.error("Stripe subscription error:", error);
        res.status(400).json({ message: error.message });
      }
    });
    
    // Webhook to handle successful subscription payments
    app.post("/api/webhook", async (req, res) => {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!endpointSecret) {
        return res.status(500).json({ message: "Webhook secret is not configured" });
      }
      
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          endpointSecret
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }
      
      // Handle the event
      if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.status === 'active') {
          // Find user by subscription ID and update premium status
          const users = Array.from(storage.users?.values() || []);
          const user = users.find(u => u.stripeSubscriptionId === subscription.id);
          
          if (user) {
            await storage.updateUserPremium(user.id, true);
          }
        }
      }
      
      res.json({ received: true });
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
