import { type User, type InsertUser, type Giveaway, type InsertGiveaway, type Ad, type InsertAd } from "@shared/schema";
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
  updateGiveawayStatus(id: string, status: "pending" | "completed" | "failed", winners?: any): Promise<void>;
  // Ad methods
  createAd(ad: InsertAd): Promise<Ad>;
  getAd(id: string): Promise<Ad | undefined>;
  getActiveAds(): Promise<Ad[]>;
  getAllAds(): Promise<Ad[]>;
  updateAd(id: string, updates: Partial<Ad>): Promise<Ad | undefined>;
  deleteAd(id: string): Promise<boolean>;
  incrementAdStats(id: string, type: 'view' | 'click'): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private giveaways: Map<string, Giveaway>;
  private ads: Map<string, Ad>;
  private dataFile: string;

  constructor() {
    this.users = new Map();
    this.giveaways = new Map();
    this.ads = new Map();
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
        this.ads = new Map((data.ads || []).map(([id, a]: [string, any]) => [
          id,
          { ...a, createdAt: new Date(a.createdAt) }
        ]));
        console.log(`[Storage] Loaded ${this.users.size} users, ${this.giveaways.size} giveaways, and ${this.ads.size} ads from ${this.dataFile}`);
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
        ads: Array.from(this.ads.entries()),
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
      username: username ?? null,
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
      status: (insertGiveaway.status as any) || "pending",
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

  async updateGiveawayStatus(id: string, status: "pending" | "completed" | "failed", winners?: any): Promise<void> {
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

  // Ad Methods
  async createAd(insertAd: InsertAd): Promise<Ad> {
    const id = randomUUID();
    const ad: Ad = {
      ...insertAd,
      id,
      imageUrl: insertAd.imageUrl,
      linkUrl: insertAd.linkUrl,
      clicks: 0,
      impressions: 0,
      createdAt: new Date(),
      active: insertAd.active ?? true
    };
    this.ads.set(id, ad);
    this.saveData();
    return ad;
  }

  async getAd(id: string): Promise<Ad | undefined> {
    return this.ads.get(id);
  }

  async getActiveAds(): Promise<Ad[]> {
    return Array.from(this.ads.values()).filter(ad => ad.active);
  }

  async getAllAds(): Promise<Ad[]> {
    return Array.from(this.ads.values());
  }

  async updateAd(id: string, updates: Partial<Ad>): Promise<Ad | undefined> {
    const ad = this.ads.get(id);
    if (ad) {
      Object.assign(ad, updates);
      this.ads.set(id, ad);
      this.saveData();
      return ad;
    }
    return undefined;
  }

  async deleteAd(id: string): Promise<boolean> {
    const existed = this.ads.has(id);
    if (existed) {
      this.ads.delete(id);
      this.saveData();
    }
    return existed;
  }

  async incrementAdStats(id: string, type: 'view' | 'click'): Promise<void> {
    const ad = this.ads.get(id);
    if (ad) {
      if (type === 'view') {
        ad.impressions = (ad.impressions || 0) + 1;
      } else {
        ad.clicks = (ad.clicks || 0) + 1;
      }
      this.ads.set(id, ad);
      // Don't save on every increment to avoid IO thrashing, 
      // but for this simple MemStorage implementation we will save for persistence safety
      this.saveData();
    }
  }
}

export const storage = new MemStorage();
