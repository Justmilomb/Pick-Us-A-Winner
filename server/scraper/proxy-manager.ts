import { log } from "../log";

export interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
}

export class ProxyManager {
    private proxies: ProxyConfig[] = [];
    private currentIndex = 0;
    private failedProxies = new Set<number>();

    constructor() {
        this.loadProxies();
    }

    /**
     * Load proxies from environment variable or file
     * Format: http://user:pass@host:port or http://host:port
     */
    private loadProxies(): void {
        const proxyList = process.env.PROXY_LIST;
        
        if (!proxyList) {
            log("No PROXY_LIST found in environment. Running without proxies.", "scraper");
            return;
        }

        const proxyStrings = proxyList.split(',').map(s => s.trim());
        
        for (const proxyString of proxyStrings) {
            try {
                const url = new URL(proxyString);
                const proxy: ProxyConfig = {
                    host: url.hostname,
                    port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
                };

                if (url.username) {
                    proxy.username = url.username;
                }
                if (url.password) {
                    proxy.password = url.password;
                }

                this.proxies.push(proxy);
            } catch (error) {
                log(`Invalid proxy format: ${proxyString}. Skipping.`, "scraper");
            }
        }

        log(`Loaded ${this.proxies.length} proxies`, "scraper");
    }

    /**
     * Get the next available proxy in rotation
     */
    getNextProxy(): ProxyConfig | null {
        if (this.proxies.length === 0) {
            return null;
        }

        // If all proxies failed, reset the failed set
        if (this.failedProxies.size >= this.proxies.length) {
            log("All proxies failed. Resetting failed list.", "scraper");
            this.failedProxies.clear();
        }

        // Find next available proxy
        let attempts = 0;
        while (attempts < this.proxies.length) {
            const proxy = this.proxies[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

            if (!this.failedProxies.has(this.currentIndex - 1 === -1 ? this.proxies.length - 1 : this.currentIndex - 1)) {
                return proxy;
            }
            attempts++;
        }

        // If all are failed, return the first one anyway
        return this.proxies[0];
    }

    /**
     * Mark a proxy as failed
     */
    markFailed(proxy: ProxyConfig): void {
        const index = this.proxies.findIndex(
            p => p.host === proxy.host && p.port === proxy.port
        );
        if (index !== -1) {
            this.failedProxies.add(index);
            log(`Marked proxy ${proxy.host}:${proxy.port} as failed`, "scraper");
        }
    }

    /**
     * Get proxy server string for Puppeteer
     */
    getProxyServer(proxy: ProxyConfig): string {
        return `${proxy.host}:${proxy.port}`;
    }

    /**
     * Check if proxies are available
     */
    hasProxies(): boolean {
        return this.proxies.length > 0;
    }
}
