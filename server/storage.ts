import { type User, type InsertUser, type Giveaway, type InsertGiveaway } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Giveaway methods
  createGiveaway(giveaway: InsertGiveaway): Promise<Giveaway>;
  getPendingGiveaways(): Promise<Giveaway[]>;
  updateGiveawayStatus(id: string, status: string, winners?: any): Promise<void>;
  getUserGiveaways(userId: string): Promise<Giveaway[]>;
  getAllGiveaways(): Promise<Giveaway[]>;
  getGiveawayByToken(token: string): Promise<Giveaway | undefined>;
  updateGiveaway(id: string, updates: Partial<Giveaway>): Promise<Giveaway | undefined>;
  deleteGiveaway(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private giveaways: Map<string, Giveaway>;
  private dataFile: string;

  constructor() {
    this.users = new Map();
    this.giveaways = new Map();
    this.dataFile = path.resolve(process.cwd(), "db.json");
    this.loadData();
  }

  private loadData() {
    if (fs.existsSync(this.dataFile)) {
      try {
        const rawData = fs.readFileSync(this.dataFile, "utf-8");
        const data = JSON.parse(rawData);
        this.users = new Map(data.users || []);
        // Handle date strings coming back from JSON
        this.giveaways = new Map((data.giveaways || []).map(([id, g]: [string, any]) => [
          id,
          { ...g, scheduledFor: new Date(g.scheduledFor), createdAt: new Date(g.createdAt) }
        ]));
        console.log(`[Storage] Loaded ${this.users.size} users and ${this.giveaways.size} giveaways from ${this.dataFile}`);
      } catch (error) {
        console.error("[Storage] Error loading data file:", error);
      }
    }
  }

  private saveData() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        giveaways: Array.from(this.giveaways.entries()),
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("[Storage] Error saving data file:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    this.saveData();
    return user;
  }

  async createGiveaway(insertGiveaway: InsertGiveaway): Promise<Giveaway> {
    const id = randomUUID();
    const accessToken = randomUUID();
    const giveaway: Giveaway = {
      ...insertGiveaway,
      id,
      createdAt: new Date(),
      winners: null,
      status: insertGiveaway.status || "pending",
      accessToken: accessToken as any
    };
    this.giveaways.set(id, giveaway);
    this.saveData();
    return giveaway;
  }

  async getPendingGiveaways(): Promise<Giveaway[]> {
    const now = new Date();
    return Array.from(this.giveaways.values()).filter(
      g => g.status === 'pending' && new Date(g.scheduledFor) <= now
    );
  }

  async updateGiveawayStatus(id: string, status: string, winners?: any): Promise<void> {
    const giveaway = this.giveaways.get(id);
    if (giveaway) {
      giveaway.status = status;
      if (winners) {
        giveaway.winners = winners;
      }
      this.giveaways.set(id, giveaway);
      this.saveData();
    }
  }

  async getUserGiveaways(userId: string): Promise<Giveaway[]> {
    return Array.from(this.giveaways.values()).filter(g => g.userId === userId);
  }

  async getAllGiveaways(): Promise<Giveaway[]> {
    return Array.from(this.giveaways.values());
  }

  async getGiveawayByToken(token: string): Promise<Giveaway | undefined> {
    return Array.from(this.giveaways.values()).find(
      (g) => (g as any).accessToken === token
    );
  }

  async updateGiveaway(id: string, updates: Partial<Giveaway>): Promise<Giveaway | undefined> {
    const giveaway = this.giveaways.get(id);
    if (giveaway) {
      Object.assign(giveaway, updates);
      this.giveaways.set(id, giveaway);
      this.saveData();
      return giveaway;
    }
    return undefined;
  }

  async deleteGiveaway(id: string): Promise<boolean> {
    const existed = this.giveaways.has(id);
    if (existed) {
      this.giveaways.delete(id);
      this.saveData();
    }
    return existed;
  }
}

export const storage = new MemStorage();
