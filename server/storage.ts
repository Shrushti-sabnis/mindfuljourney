import { users, type User, type InsertUser, journals, type Journal, type InsertJournal, moods, type Mood, type InsertMood, mindfulnessSessions, type MindfulnessSession } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremium(id: number, isPremium: boolean): Promise<User>;
  updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<User>;

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private journals: Map<number, Journal>;
  private moods: Map<number, Mood>;
  private mindfulnessSessions: Map<number, MindfulnessSession>;
  sessionStore: session.SessionStore;
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
    const newMood: Mood = { ...mood, id, createdAt: now };
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

export const storage = new MemStorage();
