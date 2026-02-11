/**
 * Scraper Relay - WebSocket server that connects Render to a local scraper worker
 * 
 * Architecture:
 * 1. This WebSocket server runs on the Render server alongside Express
 * 2. A local worker script connects to it via WebSocket
 * 3. When a scrape request comes in, it's forwarded to the worker
 * 4. The worker runs Puppeteer locally and sends results back
 */

import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { log } from "./log";
import { FetchCommentsResult } from "./instagram";

const RELAY_SECRET = process.env.SCRAPER_RELAY_SECRET || "";

interface PendingRequest {
    resolve: (result: FetchCommentsResult) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
}

class ScraperRelay {
    private wss: WebSocketServer | null = null;
    private workerSocket: WebSocket | null = null;
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private requestCounter = 0;

    /**
     * Initialize the WebSocket server on the existing HTTP server
     */
    init(httpServer: Server): void {
        this.wss = new WebSocketServer({
            server: httpServer,
            path: "/ws/scraper"
        });

        log("Scraper relay WebSocket server initialized on /ws/scraper", "relay");

        this.wss.on("connection", (ws, req) => {
            log(`Worker connection attempt from ${req.socket.remoteAddress}`, "relay");

            // Authenticate the worker
            const url = new URL(req.url || "", `http://${req.headers.host}`);
            const secret = url.searchParams.get("secret");

            if (!RELAY_SECRET) {
                log("WARNING: SCRAPER_RELAY_SECRET is not set. Rejecting all worker connections.", "relay");
                ws.close(4001, "Relay secret not configured on server");
                return;
            }

            if (secret !== RELAY_SECRET) {
                log("Worker connection rejected: invalid secret", "relay");
                ws.close(4002, "Invalid secret");
                return;
            }

            // Accept the worker
            if (this.workerSocket) {
                log("Replacing existing worker connection", "relay");
                this.workerSocket.close(4003, "Replaced by new worker");
            }

            this.workerSocket = ws;
            log("✓ Worker connected and authenticated", "relay");

            ws.on("message", (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleWorkerMessage(message);
                } catch (e) {
                    log(`Failed to parse worker message: ${e}`, "relay");
                }
            });

            ws.on("close", (code, reason) => {
                log(`Worker disconnected: ${code} ${reason}`, "relay");
                if (this.workerSocket === ws) {
                    this.workerSocket = null;
                }
                // Reject all pending requests
                for (const [id, pending] of this.pendingRequests) {
                    clearTimeout(pending.timeout);
                    pending.reject(new Error("Worker disconnected"));
                    this.pendingRequests.delete(id);
                }
            });

            ws.on("error", (err) => {
                log(`Worker connection error: ${err.message}`, "relay");
            });

            // Send a ping to confirm connection
            ws.send(JSON.stringify({ type: "connected", message: "You are connected to the scraper relay" }));
        });
    }

    /**
     * Handle messages from the worker
     */
    private handleWorkerMessage(message: any): void {
        if (message.type === "scrape_result") {
            const pending = this.pendingRequests.get(message.requestId);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(message.requestId);

                if (message.error) {
                    log(`Worker returned error for ${message.requestId}: ${message.error}`, "relay");
                    pending.reject(new Error(message.error));
                } else {
                    log(`Worker returned ${message.result?.comments?.length || 0} comments for ${message.requestId}`, "relay");
                    pending.resolve(message.result);
                }
            }
        } else if (message.type === "heartbeat") {
            // Worker is alive
            this.workerSocket?.send(JSON.stringify({ type: "heartbeat_ack" }));
        }
    }

    /**
     * Check if a worker is currently connected
     */
    isWorkerConnected(): boolean {
        return this.workerSocket !== null && this.workerSocket.readyState === WebSocket.OPEN;
    }

    /**
     * Send a scrape request to the connected worker
     */
    async scrape(postUrl: string, timeoutMs: number = 5 * 60 * 1000): Promise<FetchCommentsResult> {
        if (!this.isWorkerConnected()) {
            throw new Error("No scraper worker connected. Run the local worker script on your computer.");
        }

        const requestId = `req_${++this.requestCounter}_${Date.now()}`;

        return new Promise<FetchCommentsResult>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error(`Scrape request timed out after ${timeoutMs / 1000}s`));
            }, timeoutMs);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });

            log(`Sending scrape request ${requestId} for ${postUrl}`, "relay");

            this.workerSocket!.send(JSON.stringify({
                type: "scrape_request",
                requestId,
                postUrl,
            }));
        });
    }
}

// Singleton instance
export const scraperRelay = new ScraperRelay();
