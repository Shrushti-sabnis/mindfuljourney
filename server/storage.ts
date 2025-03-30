import { users, type User, type InsertUser, journals, type Journal, type InsertJournal, moods, type Mood, type InsertMood, mindfulnessSessions, type MindfulnessSession } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { hashPassword, comparePasswords } from "./auth";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremium(id: number, isPremium: boolean): Promise<User>;
  updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<User>;
  updateUserProfile(id: number, userData: { username?: string; email?: string }): Promise<User>;
  updateUserPassword(id: number, oldPassword: string, newPassword: string): Promise<User>;

  // Journal operations
  getJournal(id: number): Promise<Journal | undefined>;
  getJournalsByUserId(userId: number): Promise<Journal[]>;
  createJournal(journal: InsertJournal): Promise<Journal>;
  updateJournal(id: number, journal: Partial<InsertJournal>): Promise<Journal>;
  deleteJournal(id: number): Promise<boolean>;

  // Mood operations
  getMood(id: number): Promise<Mood | undefined>;
  getMoodsByUserId(userId: number): Promise<Mood[]>;
  getMoodsByUserIdInRange(userId: number, startDate: Date, endDate: Date): Promise<Mood[]>;
  createMood(mood: InsertMood): Promise<Mood>;

  // Mindfulness operations
  getMindfulnessSessions(includePremuim: boolean): Promise<MindfulnessSession[]>;
  getMindfulnessSession(id: number): Promise<MindfulnessSession | undefined>;
  
  // Session store for auth
  sessionStore: any; // Using any type to avoid import resolution issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private journals: Map<number, Journal>;
  private moods: Map<number, Mood>;
  private mindfulnessSessions: Map<number, MindfulnessSession>;
  sessionStore: any; // Using any type to avoid import resolution issues
  private userId: number;
  private journalId: number;
  private moodId: number;
  private sessionId: number;

  constructor() {
    this.users = new Map();
    this.journals = new Map();
    this.moods = new Map();
    this.mindfulnessSessions = new Map();
    this.userId = 1;
    this.journalId = 1;
    this.moodId = 1;
    this.sessionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Initialize with some mindfulness sessions
    this.initMindfulnessSessions();
  }

  private initMindfulnessSessions() {
    const freeSessions = [
      {
        id: this.sessionId++,
        title: "Morning Meditation",
        description: "Start your day with clarity and intention",
        audioUrl: "https://example.com/audio/morning-meditation.mp3",
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
        duration: 600, // 10 minutes
        isPremium: false,
      },
      {
        id: this.sessionId++,
        title: "Stress Relief",
        description: "Release tension and find calm",
        audioUrl: "https://example.com/audio/stress-relief.mp3",
        imageUrl: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83",
        duration: 900, // 15 minutes
        isPremium: false,
      },
      {
        id: this.sessionId++,
        title: "Evening Wind Down",
        description: "Prepare your mind for restful sleep",
        audioUrl: "https://example.com/audio/evening-wind-down.mp3",
        imageUrl: "https://images.unsplash.com/photo-1519834804175-d5e9788535ac",
        duration: 480, // 8 minutes
        isPremium: false,
      }
    ];

    const premiumSessions = [
      {
        id: this.sessionId++,
        title: "Deep Focus",
        description: "Enhance concentration and productivity",
        audioUrl: "https://example.com/audio/deep-focus.mp3",
        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
        duration: 1200, // 20 minutes
        isPremium: true,
      },
      {
        id: this.sessionId++,
        title: "Anxiety Release",
        description: "Techniques to calm anxious thoughts",
        audioUrl: "https://example.com/audio/anxiety-release.mp3",
        imageUrl: "https://images.unsplash.com/photo-1515894274780-af5088f618f6",
        duration: 900, // 15 minutes
        isPremium: true,
      }
    ];

    [...freeSessions, ...premiumSessions].forEach(session => {
      this.mindfulnessSessions.set(session.id, session as MindfulnessSession);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => 
      user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => 
      user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser,
      id,
      isPremium: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPremium(id: number, isPremium: boolean): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, isPremium };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: stripeInfo.stripeCustomerId,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
      isPremium: true
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(id: number, userData: { username?: string; email?: string }): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    // Check if username is being updated and is unique
    if (userData.username && userData.username !== user.username) {
      const existingUserWithUsername = await this.getUserByUsername(userData.username);
      if (existingUserWithUsername) {
        throw new Error("Username already taken");
      }
    }
    
    // Check if email is being updated and is unique
    if (userData.email && userData.email !== user.email) {
      const existingUserWithEmail = await this.getUserByEmail(userData.email);
      if (existingUserWithEmail) {
        throw new Error("Email already in use");
      }
    }
    
    const updatedUser = { 
      ...user,
      ...(userData.username && { username: userData.username }),
      ...(userData.email && { email: userData.email })
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(id: number, oldPassword: string, newPassword: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    // Verify old password
    const isPasswordValid = await comparePasswords(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user with the new password
    const updatedUser = { 
      ...user,
      password: hashedPassword
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Journal operations
  async getJournal(id: number): Promise<Journal | undefined> {
    return this.journals.get(id);
  }

  async getJournalsByUserId(userId: number): Promise<Journal[]> {
    return Array.from(this.journals.values())
      .filter((journal) => journal.userId === userId)
      .sort((a, b) => {
        // Sort by date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createJournal(journal: InsertJournal): Promise<Journal> {
    const id = this.journalId++;
    const now = new Date();
    const newJournal: Journal = { ...journal, id, createdAt: now };
    this.journals.set(id, newJournal);
    return newJournal;
  }

  async updateJournal(id: number, journal: Partial<InsertJournal>): Promise<Journal> {
    const existingJournal = await this.getJournal(id);
    if (!existingJournal) throw new Error("Journal not found");
    
    const updatedJournal = { ...existingJournal, ...journal };
    this.journals.set(id, updatedJournal);
    return updatedJournal;
  }

  async deleteJournal(id: number): Promise<boolean> {
    return this.journals.delete(id);
  }

  // Mood operations
  async getMood(id: number): Promise<Mood | undefined> {
    return this.moods.get(id);
  }

  async getMoodsByUserId(userId: number): Promise<Mood[]> {
    return Array.from(this.moods.values())
      .filter((mood) => mood.userId === userId)
      .sort((a, b) => {
        // Sort by date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getMoodsByUserIdInRange(userId: number, startDate: Date, endDate: Date): Promise<Mood[]> {
    return Array.from(this.moods.values())
      .filter((mood) => {
        const moodDate = new Date(mood.createdAt);
        return mood.userId === userId && 
               moodDate >= startDate && 
               moodDate <= endDate;
      })
      .sort((a, b) => {
        // Sort by date ascending
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async createMood(mood: InsertMood): Promise<Mood> {
    const id = this.moodId++;
    const now = new Date();
    const newMood: Mood = { 
      ...mood, 
      id, 
      createdAt: now,
      note: mood.note || null // Ensure note is string or null, never undefined
    };
    this.moods.set(id, newMood);
    return newMood;
  }

  // Mindfulness operations
  async getMindfulnessSessions(includePremium: boolean): Promise<MindfulnessSession[]> {
    const sessions = Array.from(this.mindfulnessSessions.values());
    if (includePremium) {
      return sessions;
    }
    return sessions.filter(session => !session.isPremium);
  }

  async getMindfulnessSession(id: number): Promise<MindfulnessSession | undefined> {
    return this.mindfulnessSessions.get(id);
  }
}

// Create a PostgreSQL database storage class
export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  sessionStore: any;

  constructor() {
    // Create a PostgreSQL pool connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Initialize Drizzle ORM with the PostgreSQL pool
    this.db = drizzle(pool);

    // Initialize session store with the PostgreSQL pool
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });

    // Initialize mindfulness sessions
    this.initMindfulnessSessions();
  }

  private async initMindfulnessSessions() {
    try {
      // Check if there are any existing mindfulness sessions
      const existingSessions = await this.db.select().from(mindfulnessSessions);

      if (existingSessions.length > 0) {
        console.log('Mindfulness sessions already exist in database');
        return;
      }

      console.log('Initializing mindfulness sessions in database...');

      const now = new Date();

      // Free sessions
      const freeSessions = [
        {
          title: "Morning Meditation",
          description: "Start your day with clarity and intention",
          audioUrl: "https://example.com/audio/morning-meditation.mp3",
          imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
          duration: 600, // 10 minutes
          isPremium: false,
          createdAt: now
        },
        {
          title: "Stress Relief",
          description: "Release tension and find calm",
          audioUrl: "https://example.com/audio/stress-relief.mp3",
          imageUrl: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83",
          duration: 900, // 15 minutes
          isPremium: false,
          createdAt: now
        },
        {
          title: "Evening Wind Down",
          description: "Prepare your mind for restful sleep",
          audioUrl: "https://example.com/audio/evening-wind-down.mp3",
          imageUrl: "https://images.unsplash.com/photo-1519834804175-d5e9788535ac",
          duration: 480, // 8 minutes
          isPremium: false,
          createdAt: now
        }
      ];

      // Premium sessions
      const premiumSessions = [
        {
          title: "Deep Focus",
          description: "Enhance concentration and productivity",
          audioUrl: "https://example.com/audio/deep-focus.mp3",
          imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
          duration: 1200, // 20 minutes
          isPremium: true,
          createdAt: now
        },
        {
          title: "Anxiety Release",
          description: "Techniques to calm anxious thoughts",
          audioUrl: "https://example.com/audio/anxiety-release.mp3",
          imageUrl: "https://images.unsplash.com/photo-1515894274780-af5088f618f6",
          duration: 900, // 15 minutes
          isPremium: true,
          createdAt: now
        }
      ];

      // Insert all sessions to the database
      for (const session of [...freeSessions, ...premiumSessions]) {
        await this.db.insert(mindfulnessSessions).values(session);
      }

      console.log('Mindfulness sessions initialized successfully');
    } catch (error) {
      console.error('Error initializing mindfulness sessions:', error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPremium(id: number, isPremium: boolean): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ isPremium })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId,
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
        isPremium: true
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }

  async updateUserProfile(id: number, userData: { username?: string; email?: string }): Promise<User> {
    // Check if username is already taken
    if (userData.username) {
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Username is already taken');
      }
    }
    
    // Check if email is already taken
    if (userData.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email is already taken');
      }
    }
    
    const [updatedUser] = await this.db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async updateUserPassword(id: number, oldPassword: string, newPassword: string): Promise<User> {
    // Get the user first to check the old password
    const user = await this.getUser(id);
    
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Verify old password
    const isPasswordValid = await comparePasswords(oldPassword, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the password
    const [updatedUser] = await this.db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Journal operations
  async getJournal(id: number): Promise<Journal | undefined> {
    const result = await this.db.select().from(journals).where(eq(journals.id, id));
    return result[0];
  }

  async getJournalsByUserId(userId: number): Promise<Journal[]> {
    return await this.db
      .select()
      .from(journals)
      .where(eq(journals.userId, userId))
      .orderBy(desc(journals.createdAt));
  }

  async createJournal(journal: InsertJournal): Promise<Journal> {
    const [newJournal] = await this.db.insert(journals).values(journal).returning();
    return newJournal;
  }

  async updateJournal(id: number, journal: Partial<InsertJournal>): Promise<Journal> {
    const [updatedJournal] = await this.db
      .update(journals)
      .set(journal)
      .where(eq(journals.id, id))
      .returning();
    
    if (!updatedJournal) {
      throw new Error(`Journal with ID ${id} not found`);
    }
    
    return updatedJournal;
  }

  async deleteJournal(id: number): Promise<boolean> {
    const result = await this.db.delete(journals).where(eq(journals.id, id)).returning();
    return result.length > 0;
  }

  // Mood operations
  async getMood(id: number): Promise<Mood | undefined> {
    const result = await this.db.select().from(moods).where(eq(moods.id, id));
    return result[0];
  }

  async getMoodsByUserId(userId: number): Promise<Mood[]> {
    return await this.db
      .select()
      .from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(desc(moods.createdAt));
  }

  async getMoodsByUserIdInRange(userId: number, startDate: Date, endDate: Date): Promise<Mood[]> {
    return await this.db
      .select()
      .from(moods)
      .where(
        and(
          eq(moods.userId, userId),
          gte(moods.createdAt, startDate),
          lte(moods.createdAt, endDate)
        )
      )
      .orderBy(moods.createdAt);
  }

  async createMood(mood: InsertMood): Promise<Mood> {
    const [newMood] = await this.db.insert(moods).values({
      ...mood,
      note: mood.note || null // Ensure note is string or null, never undefined
    }).returning();
    
    return newMood;
  }

  // Mindfulness operations
  async getMindfulnessSessions(includePremium: boolean): Promise<MindfulnessSession[]> {
    if (includePremium) {
      return await this.db.select().from(mindfulnessSessions);
    } else {
      return await this.db
        .select()
        .from(mindfulnessSessions)
        .where(eq(mindfulnessSessions.isPremium, false));
    }
  }

  async getMindfulnessSession(id: number): Promise<MindfulnessSession | undefined> {
    const result = await this.db
      .select()
      .from(mindfulnessSessions)
      .where(eq(mindfulnessSessions.id, id));
    
    return result[0];
  }
}

// Use the database storage instead of memory storage
export const storage = new DatabaseStorage();
