import { type User, type InsertUser, type Giveaway, type InsertGiveaway, type Ad, type InsertAd } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Giveaway methods
  createGiveaway(giveaway: InsertGiveaway): Promise<Giveaway>;
  getPendingGiveaways(): Promise<Giveaway[]>;
  getGiveaway(id: string): Promise<Giveaway | undefined>;
  updateGiveawayStatus(id: string, status: "pending" | "completed" | "failed", winners?: any): Promise<void>;
  getUserGiveaways(userId: string): Promise<Giveaway[]>;
  getAllGiveaways(): Promise<Giveaway[]>;
  getGiveawayByToken(token: string): Promise<Giveaway | undefined>;
  updateGiveaway(id: string, updates: Partial<Giveaway>): Promise<Giveaway | undefined>;
  deleteGiveaway(id: string): Promise<boolean>;
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
    const configuredDataFile = process.env.DATA_FILE?.trim();
    this.dataFile = configuredDataFile
      ? path.resolve(configuredDataFile)
      : path.resolve(process.cwd(), "db.json");
    if (!configuredDataFile && process.env.NODE_ENV === "production") {
      console.warn("[Storage] DATA_FILE is not set. Using local db.json, which may be ephemeral on many hosts.");
    }
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      username: insertUser.username || null,
      googleId: insertUser.googleId || null,
      password: insertUser.password || null,
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
      g => {
        if (g.status !== "pending") return false;
        const nextAttemptAt = (g as any)?.config?._scheduler?.nextAttemptAt;
        if (!nextAttemptAt) return true;
        return new Date(nextAttemptAt) <= now;
      }
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

  async getGiveaway(id: string): Promise<Giveaway | undefined> {
    return this.giveaways.get(id);
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

class PgStorage implements IStorage {
  private pool: Pool;
  private anonymousUserReady: Promise<void> | null = null;

  constructor(databaseUrl: string) {
    const isLocal =
      databaseUrl.includes("localhost") ||
      databaseUrl.includes("127.0.0.1");
    this.pool = new Pool({
      connectionString: databaseUrl,
      ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
    });
  }

  private mapUser(row: any): User {
    return {
      id: row.id,
      firstName: row.firstName,
      username: row.username ?? null,
      email: row.email,
      password: row.password ?? null,
      googleId: row.googleId ?? null,
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
    } as User;
  }

  private mapGiveaway(row: any): Giveaway {
    return {
      id: row.id,
      userId: row.userId,
      scheduledFor: new Date(row.scheduledFor),
      status: row.status,
      config: row.config,
      winners: row.winners,
      accessToken: row.accessToken,
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
    } as Giveaway;
  }

  private mapAd(row: any): Ad {
    return {
      id: row.id,
      imageUrl: row.imageUrl,
      linkUrl: row.linkUrl,
      active: !!row.active,
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
    } as Ad;
  }

  private async ensureAnonymousUser(): Promise<void> {
    if (!this.anonymousUserReady) {
      this.anonymousUserReady = (async () => {
        await this.pool.query(
          `INSERT INTO users (id, first_name, email)
           VALUES ('anonymous', 'Guest', 'anonymous@pickusawinner.local')
           ON CONFLICT (id) DO NOTHING`,
        );
      })().catch((error) => {
        this.anonymousUserReady = null;
        throw error;
      });
    }
    await this.anonymousUserReady;
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.pool.query(
      `SELECT id, first_name AS "firstName", username, email, password, google_id AS "googleId", created_at AS "createdAt"
       FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0] ? this.mapUser(result.rows[0]) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query(
      `SELECT id, first_name AS "firstName", username, email, password, google_id AS "googleId", created_at AS "createdAt"
       FROM users WHERE username = $1 LIMIT 1`,
      [username],
    );
    return result.rows[0] ? this.mapUser(result.rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.pool.query(
      `SELECT id, first_name AS "firstName", username, email, password, google_id AS "googleId", created_at AS "createdAt"
       FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    return result.rows[0] ? this.mapUser(result.rows[0]) : undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await this.pool.query(
      `SELECT id, first_name AS "firstName", username, email, password, google_id AS "googleId", created_at AS "createdAt"
       FROM users WHERE google_id = $1 LIMIT 1`,
      [googleId],
    );
    return result.rows[0] ? this.mapUser(result.rows[0]) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const result = await this.pool.query(
      `INSERT INTO users (id, first_name, username, email, password, google_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, first_name AS "firstName", username, email, password, google_id AS "googleId", created_at AS "createdAt"`,
      [
        id,
        insertUser.firstName,
        insertUser.username ?? null,
        insertUser.email,
        insertUser.password ?? null,
        insertUser.googleId ?? null,
      ],
    );
    return this.mapUser(result.rows[0]);
  }

  async createGiveaway(insertGiveaway: InsertGiveaway): Promise<Giveaway> {
    const id = randomUUID();
    const accessToken = randomUUID();
    const userId = insertGiveaway.userId === "anonymous" ? "anonymous" : insertGiveaway.userId;
    if (userId === "anonymous") {
      await this.ensureAnonymousUser();
    }

    const result = await this.pool.query(
      `INSERT INTO giveaways (id, user_id, scheduled_for, status, config, winners, access_token)
       VALUES ($1, $2, $3, $4, $5::jsonb, NULL, $6)
       RETURNING id, user_id AS "userId", scheduled_for AS "scheduledFor", status, config, winners, access_token AS "accessToken", created_at AS "createdAt"`,
      [
        id,
        userId,
        insertGiveaway.scheduledFor,
        (insertGiveaway.status as any) || "pending",
        JSON.stringify(insertGiveaway.config),
        accessToken,
      ],
    );
    return this.mapGiveaway(result.rows[0]);
  }

  async getPendingGiveaways(): Promise<Giveaway[]> {
    const result = await this.pool.query(
      `SELECT id, user_id AS "userId", scheduled_for AS "scheduledFor", status, config, winners, access_token AS "accessToken", created_at AS "createdAt"
       FROM giveaways
       WHERE status = 'pending'`,
    );
    const now = new Date();
    return result.rows
      .map((r) => this.mapGiveaway(r))
      .filter((g: any) => {
        const nextAttemptAt = g?.config?._scheduler?.nextAttemptAt;
        if (!nextAttemptAt) return true;
        return new Date(nextAttemptAt) <= now;
      });
  }

  async updateGiveawayStatus(id: string, status: "pending" | "completed" | "failed", winners?: any): Promise<void> {
    if (typeof winners !== "undefined") {
      await this.pool.query(`UPDATE giveaways SET status = $2, winners = $3::jsonb WHERE id = $1`, [id, status, JSON.stringify(winners)]);
      return;
    }
    await this.pool.query(`UPDATE giveaways SET status = $2 WHERE id = $1`, [id, status]);
  }

  async getGiveaway(id: string): Promise<Giveaway | undefined> {
    const result = await this.pool.query(
      `SELECT id, user_id AS "userId", scheduled_for AS "scheduledFor", status, config, winners, access_token AS "accessToken", created_at AS "createdAt"
       FROM giveaways
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    return result.rows[0] ? this.mapGiveaway(result.rows[0]) : undefined;
  }

  async getUserGiveaways(userId: string): Promise<Giveaway[]> {
    const result = await this.pool.query(
      `SELECT id, user_id AS "userId", scheduled_for AS "scheduledFor", status, config, winners, access_token AS "accessToken", created_at AS "createdAt"
       FROM giveaways
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows.map((r) => this.mapGiveaway(r));
  }

  async getAllGiveaways(): Promise<Giveaway[]> {
    const result = await this.pool.query(
      `SELECT id, user_id AS "userId", scheduled_for AS "scheduledFor", status, config, winners, access_token AS "accessToken", created_at AS "createdAt"
       FROM giveaways
       ORDER BY created_at DESC`,
    );
    return result.rows.map((r) => this.mapGiveaway(r));
  }

  async getGiveawayByToken(token: string): Promise<Giveaway | undefined> {
    const result = await this.pool.query(
      `SELECT id, user_id AS "userId", scheduled_for AS "scheduledFor", status, config, winners, access_token AS "accessToken", created_at AS "createdAt"
       FROM giveaways
       WHERE access_token = $1
       LIMIT 1`,
      [token],
    );
    return result.rows[0] ? this.mapGiveaway(result.rows[0]) : undefined;
  }

  async updateGiveaway(id: string, updates: Partial<Giveaway>): Promise<Giveaway | undefined> {
    const fields: string[] = [];
    const values: any[] = [id];
    let i = 2;

    if (typeof updates.scheduledFor !== "undefined") {
      fields.push(`scheduled_for = $${i++}`);
      values.push(updates.scheduledFor);
    }
    if (typeof updates.config !== "undefined") {
      fields.push(`config = $${i++}::jsonb`);
      values.push(JSON.stringify(updates.config));
    }
    if (typeof updates.status !== "undefined") {
      fields.push(`status = $${i++}`);
      values.push(updates.status);
    }
    if (typeof updates.winners !== "undefined") {
      fields.push(`winners = $${i++}::jsonb`);
      values.push(JSON.stringify(updates.winners));
    }

    if (fields.length === 0) {
      const existing = await this.pool.query(
        `SELECT id, user_id AS "userId", scheduled_for AS "scheduledFor", status, config, winners, access_token AS "accessToken", created_at AS "createdAt"
         FROM giveaways WHERE id = $1 LIMIT 1`,
        [id],
      );
      return existing.rows[0] ? this.mapGiveaway(existing.rows[0]) : undefined;
    }

    const result = await this.pool.query(
      `UPDATE giveaways
       SET ${fields.join(", ")}
       WHERE id = $1
       RETURNING id, user_id AS "userId", scheduled_for AS "scheduledFor", status, config, winners, access_token AS "accessToken", created_at AS "createdAt"`,
      values,
    );
    return result.rows[0] ? this.mapGiveaway(result.rows[0]) : undefined;
  }

  async deleteGiveaway(id: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM giveaways WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async createAd(insertAd: InsertAd): Promise<Ad> {
    const id = randomUUID();
    const result = await this.pool.query(
      `INSERT INTO ads (id, image_url, link_url, active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, image_url AS "imageUrl", link_url AS "linkUrl", active, clicks, impressions, created_at AS "createdAt"`,
      [id, insertAd.imageUrl, insertAd.linkUrl, insertAd.active ?? true],
    );
    return this.mapAd(result.rows[0]);
  }

  async getAd(id: string): Promise<Ad | undefined> {
    const result = await this.pool.query(
      `SELECT id, image_url AS "imageUrl", link_url AS "linkUrl", active, clicks, impressions, created_at AS "createdAt"
       FROM ads WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0] ? this.mapAd(result.rows[0]) : undefined;
  }

  async getActiveAds(): Promise<Ad[]> {
    const result = await this.pool.query(
      `SELECT id, image_url AS "imageUrl", link_url AS "linkUrl", active, clicks, impressions, created_at AS "createdAt"
       FROM ads WHERE active = true ORDER BY created_at DESC`,
    );
    return result.rows.map((r) => this.mapAd(r));
  }

  async getAllAds(): Promise<Ad[]> {
    const result = await this.pool.query(
      `SELECT id, image_url AS "imageUrl", link_url AS "linkUrl", active, clicks, impressions, created_at AS "createdAt"
       FROM ads ORDER BY created_at DESC`,
    );
    return result.rows.map((r) => this.mapAd(r));
  }

  async updateAd(id: string, updates: Partial<Ad>): Promise<Ad | undefined> {
    const fields: string[] = [];
    const values: any[] = [id];
    let i = 2;

    if (typeof updates.imageUrl !== "undefined") {
      fields.push(`image_url = $${i++}`);
      values.push(updates.imageUrl);
    }
    if (typeof updates.linkUrl !== "undefined") {
      fields.push(`link_url = $${i++}`);
      values.push(updates.linkUrl);
    }
    if (typeof updates.active !== "undefined") {
      fields.push(`active = $${i++}`);
      values.push(updates.active);
    }
    if (typeof updates.clicks !== "undefined") {
      fields.push(`clicks = $${i++}`);
      values.push(updates.clicks);
    }
    if (typeof updates.impressions !== "undefined") {
      fields.push(`impressions = $${i++}`);
      values.push(updates.impressions);
    }

    if (fields.length === 0) {
      return this.getAd(id);
    }

    const result = await this.pool.query(
      `UPDATE ads
       SET ${fields.join(", ")}
       WHERE id = $1
       RETURNING id, image_url AS "imageUrl", link_url AS "linkUrl", active, clicks, impressions, created_at AS "createdAt"`,
      values,
    );
    return result.rows[0] ? this.mapAd(result.rows[0]) : undefined;
  }

  async deleteAd(id: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM ads WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async incrementAdStats(id: string, type: "view" | "click"): Promise<void> {
    const field = type === "view" ? "impressions" : "clicks";
    await this.pool.query(`UPDATE ads SET ${field} = ${field} + 1 WHERE id = $1`, [id]);
  }
}

export const storage: IStorage = process.env.DATABASE_URL
  ? new PgStorage(process.env.DATABASE_URL)
  : new MemStorage();
