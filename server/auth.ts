
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
    if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
        throw new Error("SESSION_SECRET must be set in production");
    }

    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "dev_secret_key_change_me",
        resave: false,
        saveUninitialized: false,
        store: new session.MemoryStore(),
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
            secure: process.env.NODE_ENV === "production",
        },
    };

    if (app.get("env") === "production") {
        app.set("trust proxy", 1);
    }

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID || "575777924531-e580pqkqv6jbfqhkj2r8g3lhn98ocgee.apps.googleusercontent.com",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
            callbackURL: "/api/auth/google/callback"
        }, async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
            try {
                const email = profile.emails?.[0].value;
                if (!email) {
                    return done(new Error("No email found in Google profile"));
                }

                let user = await storage.getUserByGoogleId(profile.id);
                if (!user) {
                    // Check if a user with this email already exists
                    user = await storage.getUserByEmail(email);
                    if (!user) {
                        user = await storage.createUser({
                            firstName: profile.name?.givenName || profile.displayName,
                            email: email,
                            googleId: profile.id,
                            username: null,
                            password: null
                        });
                    }
                }
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        })
    );

    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                const user = await storage.getUserByEmail(email);
                if (!user || !user.password) {
                    return done(null, false, { message: "Account not found or password login not available for this account." });
                }

                if (!(await comparePasswords(password, user.password))) {
                    return done(null, false, { message: "Incorrect password. Please try again." });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }),
    );

    passport.serializeUser((user, done) => done(null, (user as SelectUser).id));
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });

    app.post("/api/register", async (req, res, next) => {
        try {
            const { firstName, email, password } = req.body;

            // 1. Basic Field Validation
            if (!firstName || !email || !password) {
                return res.status(400).json({ message: "All fields (First Name, Email, Password) are required." });
            }

            // 2. Format Validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: "Please enter a valid email address." });
            }

            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long." });
            }

            // 3. Uniqueness Checks
            const existingEmail = await storage.getUserByEmail(email);
            if (existingEmail) {
                return res.status(400).json({ message: "An account with this email already exists." });
            }

            const hashedPassword = await hashPassword(password);
            const user = await storage.createUser({
                firstName,
                email,
                password: hashedPassword,
            });

            req.login(user, (err) => {
                if (err) return next(err);
                res.status(201).json(user);
            });
        } catch (error) {
            next(error);
        }
    });

    app.post("/api/login", (req, res, next) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Both email and password are required." });
        }

        passport.authenticate("local", (err: any, user: any, info: any) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({ message: info?.message || "Invalid credentials." });
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.status(200).json(user);
            });
        })(req, res, next);
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.status(200).json({ message: "Logged out" });
        });
    });

    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get("/api/auth/google/callback",
        passport.authenticate("google", { failureRedirect: "/auth?error=google_failed" }),
        (req, res) => {
            res.redirect("/");
        }
    );

    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Not logged in" });
        res.json(req.user);
    });
}
