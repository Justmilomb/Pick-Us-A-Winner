import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";
import { log } from "../log";
import { ProxyManager, ProxyConfig } from "./proxy-manager";
import { SessionManager } from "./session-manager";
import { InstagramComment, FetchCommentsResult } from "../instagram";

// Add stealth plugin to evade detection
puppeteer.use(StealthPlugin());

export class InstagramScraper {
    private browser: Browser | null = null;
    private proxyManager: ProxyManager;
    private sessionManager: SessionManager;

    constructor() {
        this.proxyManager = new ProxyManager();
        this.sessionManager = new SessionManager();
    }

    /**
     * Launch browser with proxy if available
     */
    private async launchBrowser(): Promise<Browser> {
        const args = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--window-size=1366,768",
        ];

        const proxy = this.proxyManager.getNextProxy();
        if (proxy) {
            args.push(`--proxy-server=${this.proxyManager.getProxyServer(proxy)}`);
            log(`Using proxy: ${proxy.host}:${proxy.port}`, "scraper");
        }

        // Set headless to false to see the browser (for debugging)
        // Set SCRAPER_HEADLESS=true in .env to hide the browser (for production)
        const isHeadless = process.env.SCRAPER_HEADLESS === "true";
        log(`Launching browser (headless: ${isHeadless})...`, "scraper");
        const browser = await puppeteer.launch({
            headless: isHeadless,
            args,
            defaultViewport: { width: 1366, height: 768 },
        });

        return browser;
    }

    /**
     * Ensure we're logged in (restore session or login)
     */
    private async ensureLoggedIn(page: Page): Promise<boolean> {
        // Try to restore session first
        if (this.sessionManager.hasSession()) {
            await this.sessionManager.restoreSession(page);
            
            // Verify session is still valid
            const isValid = await this.sessionManager.verifySession(page);
            if (isValid) {
                return true;
            }
        }

        // Need to login
        const username = process.env.INSTAGRAM_USERNAME;
        const password = process.env.INSTAGRAM_PASSWORD;

        if (!username || !password) {
            log("INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD not set. Cannot login.", "scraper");
            return false;
        }

        return await this.sessionManager.login(this.browser!, username, password);
    }

    /**
     * Wait for a random amount of time (human-like behavior)
     */
    private async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Scroll within the comments section (right side of the post page)
     */
    private async scrollCommentsSection(page: Page, maxScrolls: number = 300): Promise<void> {
        let noProgressCount = 0;
        let lastCommentCount = 0;

        for (let i = 0; i < maxScrolls; i++) {
            // Click any buttons to load more comments or expand replies
            const clickedExpand = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('span, button, div, svg'));
                let clicked: string[] = [];
                
                for (const el of elements) {
                    const text = (el.textContent || '').trim();
                    const ariaLabel = el.getAttribute('aria-label') || '';
                    
                    // Look for "View all X replies" or "View replies (X)" patterns
                    if (/^(View all \d+ replies?|View \d+ replies?|View replies)/i.test(text) ||
                        /^—— View/i.test(text)) {
                        (el as HTMLElement).click();
                        clicked.push(text);
                    }
                    
                    // Look for "+" button to load more comments (Instagram uses this)
                    if (text === '+' || ariaLabel.includes('Load more') || ariaLabel.includes('more comments')) {
                        (el as HTMLElement).click();
                        clicked.push('+ (load more)');
                    }
                    
                    // Look for "Load more comments" text
                    if (/load more comments/i.test(text)) {
                        (el as HTMLElement).click();
                        clicked.push(text);
                    }
                }
                
                return clicked.length > 0 ? clicked : null;
            });

            if (clickedExpand && clickedExpand.length > 0) {
                log(`Clicked ${clickedExpand.length} expand buttons`, "scraper");
                await this.randomDelay(2000, 3000);
            }

            // Find and scroll the comments container incrementally
            const scrolled = await page.evaluate(() => {
                // The comments section is usually a scrollable container next to the media
                // Look for elements that have scrollable overflow
                const allElements = Array.from(document.querySelectorAll('div, section, ul'));
                
                for (const el of allElements) {
                    const htmlEl = el as HTMLElement;
                    const style = window.getComputedStyle(htmlEl);
                    const hasScroll = style.overflowY === 'scroll' || style.overflowY === 'auto';
                    const canScroll = htmlEl.scrollHeight > htmlEl.clientHeight + 50;
                    
                    // Check if this element contains comments (has usernames/links)
                    const hasComments = htmlEl.querySelectorAll('a[href^="/"]').length > 3;
                    
                    if (hasScroll && canScroll && hasComments) {
                        const before = htmlEl.scrollTop;
                        // Scroll incrementally (500px at a time) instead of jumping to bottom
                        // This triggers lazy loading better
                        htmlEl.scrollTop = Math.min(htmlEl.scrollTop + 500, htmlEl.scrollHeight);
                        const after = htmlEl.scrollTop;
                        if (after > before) {
                            return { scrolled: true, scrollAmount: after - before, atBottom: after + htmlEl.clientHeight >= htmlEl.scrollHeight - 10 };
                        }
                    }
                }
                
                // Alternative: scroll inside article or main content area
                const article = document.querySelector('article');
                if (article) {
                    const scrollableParent = article.closest('div[style*="overflow"]') || 
                                            article.parentElement;
                    if (scrollableParent) {
                        const htmlEl = scrollableParent as HTMLElement;
                        if (htmlEl.scrollHeight > htmlEl.clientHeight) {
                            htmlEl.scrollTop = Math.min(htmlEl.scrollTop + 500, htmlEl.scrollHeight);
                            return { scrolled: true, scrollAmount: 500, atBottom: false };
                        }
                    }
                }
                
                return { scrolled: false, scrollAmount: 0, atBottom: true };
            });

            if (scrolled.scrolled) {
                if (i % 20 === 0) {
                    log(`Scrolled comments (+${scrolled.scrollAmount}px) - iteration ${i + 1}${scrolled.atBottom ? ' (at bottom)' : ''}`, "scraper");
                }
            }

            // Wait for comments to load (1.5-2.5 seconds for speed)
            await this.randomDelay(1500, 2500);

            // Count comments by parsing body text (more accurate than DOM)
            const currentCount = await page.evaluate(() => {
                const bodyText = document.body.innerText || '';
                const lines = bodyText.split('\\n');
                let count = 0;
                let inComment = false;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    // Check if this line is a username
                    if (/^[a-zA-Z0-9._]{1,30}$/.test(line)) {
                        // Check if next non-empty line is a timestamp
                        let nextLineIdx = i + 1;
                        while (nextLineIdx < lines.length && lines[nextLineIdx].trim() === '') {
                            nextLineIdx++;
                        }
                        if (nextLineIdx < lines.length && /^(Edited\\s*•?\\s*)?\\d+\\s*[hdwm]$/i.test(lines[nextLineIdx].trim())) {
                            count++;
                            inComment = true;
                        }
                    }
                }
                return count;
            });

            if (currentCount === lastCommentCount) {
                noProgressCount++;
                // Only stop if we've had no progress for 10 iterations (was 5)
                if (noProgressCount >= 10) {
                    log(`No new comments after ${noProgressCount} iterations, stopping at ${currentCount} comments`, "scraper");
                    break;
                }
            } else {
                noProgressCount = 0;
                lastCommentCount = currentCount;
                if (i % 10 === 0 || currentCount % 50 === 0) {
                    log(`Found ~${currentCount} comments so far... (iteration ${i + 1})`, "scraper");
                }
            }
        }
        
        log(`Finished scrolling. Total comments detected: ~${lastCommentCount}`, "scraper");
    }

    /**
     * Extract comments from the page
     */
    private async extractComments(page: Page): Promise<InstagramComment[]> {
        // First, let's debug what's on the page
        const debugInfo = await page.evaluate(`
            (function() {
                var info = {
                    url: window.location.href,
                    totalLi: document.querySelectorAll('ul li').length,
                    totalDivs: document.querySelectorAll('div').length,
                    totalLinks: document.querySelectorAll('a[href^="/"]').length,
                    totalSpans: document.querySelectorAll('span').length,
                    bodyText: document.body.innerText.substring(0, 500),
                    linksWithProfiles: []
                };
                
                // Find all links that look like profile links
                var links = document.querySelectorAll('a[href^="/"]');
                for (var i = 0; i < links.length && info.linksWithProfiles.length < 15; i++) {
                    var href = links[i].getAttribute('href') || '';
                    if (href.includes('/p/') || href.includes('/reel/') || href.includes('/explore')) continue;
                    var parts = href.replace(/^\\//, '').split('/');
                    if (parts[0] && parts[0].length > 0 && parts[0].length < 30) {
                        var parent = links[i].parentElement;
                        var grandparent = parent ? parent.parentElement : null;
                        info.linksWithProfiles.push({
                            href: href,
                            text: links[i].textContent,
                            parentText: parent ? parent.textContent.substring(0, 100) : '',
                            grandparentTag: grandparent ? grandparent.tagName : ''
                        });
                    }
                }
                
                return info;
            })()
        `);
        log(`Debug URL: ${(debugInfo as any).url}`, "scraper");
        log(`Debug: li=${(debugInfo as any).totalLi}, divs=${(debugInfo as any).totalDivs}, links=${(debugInfo as any).totalLinks}, spans=${(debugInfo as any).totalSpans}`, "scraper");
        log(`Body text preview: ${(debugInfo as any).bodyText.substring(0, 300)}`, "scraper");
        log(`Profile links found: ${JSON.stringify((debugInfo as any).linksWithProfiles.slice(0, 5), null, 2)}`, "scraper");

        // Extract comments by parsing the body text - Instagram uses complex DOM
        const comments = await page.evaluate(`
            (function() {
                var results = [];
                var seen = {};
                
                // Get the full page text
                var bodyText = document.body.innerText || '';
                
                // Pattern: username\\n\\n[timestamp]\\ncomment\\n[1 like]\\nReply
                // Regex to match: username (1-30 chars, alphanumeric/underscore/dot)
                //                  optional whitespace/newlines
                //                  optional "Edited •" 
                //                  timestamp (\\d+[hdwm] or similar)
                //                  comment text (until "X like" or "Reply" or next username)
                
                // Match pattern: username, then timestamp, then comment
                // Username pattern: ^[a-zA-Z0-9._]{1,30}$
                // After username: optional whitespace, then timestamp (\\d+[hdwm]), then comment
                
                // Split by lines and process
                var lines = bodyText.split('\\n');
                var currentComment = null;
                
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    
                    // Check if this line is a username (alphanumeric with dots/underscores, 1-30 chars)
                    if (/^[a-zA-Z0-9._]{1,30}$/.test(line)) {
                        // Check if next lines contain timestamp pattern
                        var timestampPattern = /^(Edited\\s*•?\\s*)?\\d+\\s*[hdwm]$/i;
                        var nextLineIdx = i + 1;
                        while (nextLineIdx < lines.length && lines[nextLineIdx].trim() === '') {
                            nextLineIdx++;
                        }
                        
                        if (nextLineIdx < lines.length && timestampPattern.test(lines[nextLineIdx].trim())) {
                            // This looks like a comment username!
                            // Save previous comment if exists
                            if (currentComment && currentComment.text && currentComment.text.length > 0) {
                                var key = currentComment.username + ':' + currentComment.text.substring(0, 30);
                                if (!seen[key]) {
                                    seen[key] = true;
                                    results.push(currentComment);
                                }
                            }
                            
                            // Start new comment
                            currentComment = {
                                id: line + '_' + Date.now() + '_' + Math.random().toString(36).substring(7),
                                username: line,
                                text: '',
                                timestamp: new Date().toISOString(),
                                likes: 0,
                                avatar: null
                            };
                            
                            // Skip timestamp line
                            i = nextLineIdx;
                            continue;
                        }
                    }
                    
                    // If we have a current comment, collect text
                    if (currentComment) {
                        // Skip empty lines, timestamps, "X like", "Reply", "View replies"
                        if (line.length === 0) continue;
                        if (/^(Edited\\s*•?\\s*)?\\d+\\s*[hdwm]$/i.test(line)) continue;
                        if (/^\\d+\\s*likes?$/i.test(line)) continue;
                        if (/^Reply$/i.test(line)) {
                            // End of comment
                            if (currentComment.text.trim().length > 0) {
                                var key = currentComment.username + ':' + currentComment.text.substring(0, 30);
                                if (!seen[key]) {
                                    seen[key] = true;
                                    results.push(currentComment);
                                }
                            }
                            currentComment = null;
                            continue;
                        }
                        if (/^View.*replies?/i.test(line)) continue;
                        if (/^See translation$/i.test(line)) continue;
                        
                        // This is comment text
                        if (currentComment.text) {
                            currentComment.text += ' ' + line;
                        } else {
                            currentComment.text = line;
                        }
                    }
                }
                
                // Save last comment if exists
                if (currentComment && currentComment.text && currentComment.text.trim().length > 0) {
                    var key = currentComment.username + ':' + currentComment.text.substring(0, 30);
                    if (!seen[key]) {
                        results.push(currentComment);
                    }
                }
                
                // Get avatars from DOM by finding images near username text
                // Instagram structure: img (avatar) -> link (username) -> span (comment text)
                var allImages = document.querySelectorAll('img');
                var usernameToAvatar = {};
                
                for (var imgIdx = 0; imgIdx < allImages.length; imgIdx++) {
                    var img = allImages[imgIdx];
                    var src = img.getAttribute('src') || '';
                    
                    // Check if this looks like a profile picture (small, circular, in comment area)
                    // Profile pics are usually small (150x150 or similar)
                    var width = img.width || 0;
                    var height = img.height || 0;
                    var isSmall = (width > 0 && width < 200) || (height > 0 && height < 200);
                    var isProfilePic = src.includes('scontent') || src.includes('cdninstagram') || 
                                      src.includes('profile') || (isSmall && width === height);
                    
                    if (!isProfilePic) continue;
                    
                    // Look for username near this image
                    // Walk up the DOM tree to find text that matches a username
                    var parent = img.parentElement;
                    var searchDepth = 0;
                    while (parent && searchDepth < 5) {
                        // Look for links or spans with username text
                        var links = parent.querySelectorAll('a[href^="/"], span');
                        for (var linkIdx = 0; linkIdx < links.length; linkIdx++) {
                            var link = links[linkIdx];
                            var href = link.getAttribute('href') || '';
                            var text = (link.textContent || '').trim();
                            
                            // Check if this is a profile link
                            if (href.startsWith('/') && !href.includes('/p/') && !href.includes('/reel/') &&
                                !href.includes('/explore') && !href.includes('/direct/')) {
                                var username = href.replace(/^\\//, '').replace(/\\/$/, '').split('/')[0];
                                if (username && username.length > 1 && username.length < 30 && 
                                    /^[a-zA-Z0-9._]+$/.test(username)) {
                                    usernameToAvatar[username] = src;
                                    break;
                                }
                            }
                            
                            // Also check if text matches a username pattern
                            if (/^[a-zA-Z0-9._]{1,30}$/.test(text)) {
                                usernameToAvatar[text] = src;
                            }
                        }
                        parent = parent.parentElement;
                        searchDepth++;
                    }
                }
                
                // Match avatars to comments
                for (var i = 0; i < results.length; i++) {
                    var comment = results[i];
                    if (usernameToAvatar[comment.username]) {
                        comment.avatar = usernameToAvatar[comment.username];
                    }
                }
                
                return results;
            })()
        `);

        log(`Raw extraction found ${(comments as any[]).length} comments`, "scraper");

        // Remove duplicates and validate
        const uniqueComments = new Map<string, InstagramComment>();
        for (const comment of comments as any[]) {
            const key = `${comment.username}:${comment.text}`;
            if (!uniqueComments.has(key) && comment.text && comment.text.length > 0) {
                uniqueComments.set(key, {
                    id: comment.id,
                    username: comment.username,
                    text: comment.text,
                    timestamp: comment.timestamp,
                    likes: comment.likes || 0,
                    avatar: comment.avatar,
                });
            }
        }

        return Array.from(uniqueComments.values());
    }

    /**
     * Extract post code and username from URL
     */
    private parsePostUrl(postUrl: string): { postCode: string; username?: string } {
        // Extract post code from /p/CODE, /reel/CODE, or /tv/CODE
        const postMatch = postUrl.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        const postCode = postMatch ? postMatch[2] : '';
        
        // Try to extract username if present in URL
        // Format: instagram.com/USERNAME/reel/CODE or instagram.com/USERNAME/p/CODE
        // But NOT: instagram.com/reel/CODE (no username)
        const urlParts = postUrl.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '').split('/');
        
        // If URL is like: educatingmummy/reel/DTlbeqxjDLg
        // urlParts = ['educatingmummy', 'reel', 'DTlbeqxjDLg']
        // If URL is like: reel/DTlbeqxjDLg
        // urlParts = ['reel', 'DTlbeqxjDLg']
        
        let username: string | undefined;
        if (urlParts.length >= 3 && ['p', 'reel', 'tv'].includes(urlParts[1])) {
            // Username is in position 0
            username = urlParts[0];
        }
        
        log(`Parsed URL: postCode=${postCode}, username=${username || 'not found'}`, "scraper");
        return { postCode, username };
    }

    /**
     * Find username by navigating to the post first
     */
    private async findPostUsername(page: Page, postUrl: string): Promise<string | null> {
        try {
            log(`Navigating to post to find username: ${postUrl}`, "scraper");
            await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 30000 });
            await this.randomDelay(3000, 4000);
            
            // Find the username from the post page
            const username = await page.evaluate(() => {
                // Helper to extract username from href
                const extractFromHref = (href: string | null): string | null => {
                    if (!href) return null;
                    // Remove leading/trailing slashes and get first path segment
                    const clean = href.replace(/^\/+/, '').replace(/\/+$/, '').split('/')[0];
                    // Validate it looks like a username (not a special page)
                    if (clean && clean.length > 0 && 
                        !['p', 'reel', 'tv', 'explore', 'accounts', 'direct', 'stories'].includes(clean) &&
                        !clean.includes('?')) {
                        return clean;
                    }
                    return null;
                };

                // Strategy 1: Look in the header for the username link
                const headerLinks = document.querySelectorAll('header a[href^="/"]');
                for (const link of headerLinks) {
                    const username = extractFromHref(link.getAttribute('href'));
                    if (username) {
                        console.log('Found username in header:', username);
                        return username;
                    }
                }

                // Strategy 2: Look for username near the top of the post (first link that looks like a profile)
                const allLinks = document.querySelectorAll('a[href^="/"]');
                for (const link of allLinks) {
                    const href = link.getAttribute('href') || '';
                    // Skip non-profile links
                    if (href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/') ||
                        href.includes('/explore') || href.includes('/accounts') || href.includes('/direct')) {
                        continue;
                    }
                    const username = extractFromHref(href);
                    if (username) {
                        console.log('Found username from link:', username);
                        return username;
                    }
                }

                // Strategy 3: Look for text that looks like a username (with @ or followed by verified badge)
                const spans = document.querySelectorAll('span, a');
                for (const el of spans) {
                    const text = (el.textContent || '').trim();
                    // Look for usernames (alphanumeric, underscores, dots, 1-30 chars)
                    if (/^[a-zA-Z0-9_.]{1,30}$/.test(text) && text.length > 2) {
                        // Check if this element or parent has a link to a profile
                        const parentLink = el.closest('a[href^="/"]');
                        if (parentLink) {
                            const href = parentLink.getAttribute('href') || '';
                            if (!href.includes('/p/') && !href.includes('/reel/')) {
                                console.log('Found username from text:', text);
                                return text;
                            }
                        }
                    }
                }

                console.log('Could not find username on page');
                return null;
            });
            
            if (username) {
                log(`Found username from post page: ${username}`, "scraper");
            } else {
                log("Could not find username on post page", "scraper");
            }
            
            return username;
        } catch (e) {
            log(`Error finding username: ${e}`, "scraper");
            return null;
        }
    }

    /**
     * Navigate to user's profile and click on the specific post
     */
    private async openPostFromProfile(page: Page, username: string, postCode: string): Promise<boolean> {
        try {
            // Navigate to user's profile
            const profileUrl = `https://www.instagram.com/${username}/`;
            log(`Navigating to profile: ${profileUrl}`, "scraper");
            await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 30000 });
            await this.randomDelay(2000, 3000);

            // Wait for the grid to load
            await page.waitForSelector('article a[href*="/p/"], article a[href*="/reel/"]', { timeout: 10000 });
            
            // Find and click the specific post
            log(`Looking for post ${postCode} in grid...`, "scraper");
            const postFound = await page.evaluate((targetPostCode) => {
                const postLinks = Array.from(document.querySelectorAll('article a[href*="/p/"], article a[href*="/reel/"]'));
                for (const link of postLinks) {
                    const href = link.getAttribute('href') || '';
                    if (href.includes(targetPostCode)) {
                        (link as HTMLElement).click();
                        return true;
                    }
                }
                return false;
            }, postCode);

            if (postFound) {
                log("Clicked on post from grid, waiting for modal...", "scraper");
                await this.randomDelay(2000, 3000);
                
                // Wait for modal to appear
                await page.waitForSelector('div[role="dialog"]', { timeout: 10000 }).catch(() => {
                    log("Modal not found, but continuing...", "scraper");
                });
                
                return true;
            }

            log("Post not found in visible grid", "scraper");
            return false;
        } catch (e) {
            log(`Error opening post from profile: ${e}`, "scraper");
            return false;
        }
    }

    /**
     * Extract comments from Instagram API response JSON
     */
    private extractCommentsFromApiResponse(data: any): InstagramComment[] {
        const comments: InstagramComment[] = [];
        
        // Recursively search for comment data in the response
        const findComments = (obj: any, path: string = ''): void => {
            if (!obj || typeof obj !== 'object') return;
            
            // Look for common Instagram comment structures
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    findComments(item, path);
                }
                return;
            }
            
            // Check if this object looks like a comment
            if (obj.owner && obj.text) {
                const username = obj.owner.username || obj.owner?.username || obj.user?.username;
                if (username && obj.text) {
                    comments.push({
                        id: obj.id || obj.pk || `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                        username: username,
                        text: obj.text || '',
                        timestamp: obj.created_at || obj.timestamp || new Date().toISOString(),
                        likes: obj.like_count || obj.likes_count || 0,
                        avatar: obj.owner?.profile_pic_url || obj.owner?.profile_picture_url || 
                                obj.user?.profile_pic_url || undefined,
                    });
                }
            }
            
            // Check for nested comment structures
            if (obj.edge_media_to_comment?.edges) {
                for (const edge of obj.edge_media_to_comment.edges) {
                    if (edge.node) {
                        const node = edge.node;
                        const username = node.owner?.username || node.user?.username;
                        if (username && node.text) {
                            comments.push({
                                id: node.id || `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                username: username,
                                text: node.text,
                                timestamp: node.created_at || node.timestamp || new Date().toISOString(),
                                likes: node.like_count || 0,
                                avatar: node.owner?.profile_pic_url || node.user?.profile_pic_url || undefined,
                            });
                        }
                    }
                }
            }
            
            // Check for items array (common in GraphQL responses)
            if (obj.items) {
                for (const item of obj.items) {
                    findComments(item, path);
                }
            }
            
            // Check for data array
            if (obj.data) {
                findComments(obj.data, path);
            }
            
            // Recursively check all properties
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    findComments(obj[key], `${path}.${key}`);
                }
            }
        };
        
        findComments(data);
        return comments;
    }

    /**
     * Fast scrolling that stops when no new API responses arrive
     */
    private async scrollCommentsSectionFast(
        page: Page, 
        capturedComments: Map<string, InstagramComment>,
        lastApiResponseTime: { value: number }
    ): Promise<void> {
        let noNewCommentsCount = 0;
        let lastCommentCount = capturedComments.size;
        const maxScrolls = 200;
        const maxNoProgress = 10; // Stop after 10 scrolls with no new comments
        
        for (let i = 0; i < maxScrolls; i++) {
            // Click expand buttons quickly
            await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('span, button, div'));
                for (const el of elements) {
                    const text = (el.textContent || '').trim();
                    if (/^(View all \d+ replies?|View \d+ replies?|View replies|load more comments)/i.test(text) ||
                        text === '+' || el.getAttribute('aria-label')?.includes('Load more')) {
                        (el as HTMLElement).click();
                    }
                }
            });
            
            // Fast scroll
            await page.evaluate(() => {
                const allElements = Array.from(document.querySelectorAll('div, section, ul'));
                for (const el of allElements) {
                    const htmlEl = el as HTMLElement;
                    const style = window.getComputedStyle(htmlEl);
                    if ((style.overflowY === 'scroll' || style.overflowY === 'auto') &&
                        htmlEl.scrollHeight > htmlEl.clientHeight + 50) {
                        htmlEl.scrollTop = Math.min(htmlEl.scrollTop + 500, htmlEl.scrollHeight);
                        break;
                    }
                }
            });
            
            // Short delay for API calls to complete
            await this.randomDelay(300, 500);
            
            // Check if we got new comments from API
            const currentCount = capturedComments.size;
            if (currentCount > lastCommentCount) {
                noNewCommentsCount = 0;
                lastCommentCount = currentCount;
                if (i % 20 === 0) {
                    log(`Fast scrolling: ${currentCount} comments captured so far...`, "scraper");
                }
            } else {
                noNewCommentsCount++;
                if (noNewCommentsCount >= maxNoProgress) {
                    log(`No new comments after ${maxNoProgress} scrolls, stopping at ${currentCount} comments`, "scraper");
                    break;
                }
            }
        }
        
        log(`Fast scrolling complete. Total comments captured: ${capturedComments.size}`, "scraper");
    }

    /**
     * Fetch comments from an Instagram post
     */
    async fetchComments(postUrl: string): Promise<FetchCommentsResult> {
        log(`Starting custom scraper for: ${postUrl}`, "scraper");

        try {
            // Launch browser
            this.browser = await this.launchBrowser();
            const page = await this.browser.newPage();

            // Set user agent
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );

            // Ensure logged in
            const loggedIn = await this.ensureLoggedIn(page);
            if (!loggedIn) {
                throw new Error("Failed to login to Instagram");
            }

            // Set up network interception to capture API responses
            const capturedComments = new Map<string, InstagramComment>();
            const lastApiResponseTime = { value: Date.now() };
            
            page.on('response', async (response) => {
                const url = response.url();
                
                // Check if this is an Instagram API/GraphQL endpoint
                // Instagram uses various endpoints: graphql, api/v1, web API, etc.
                if (url.includes('graphql') || url.includes('/api/v1/') || 
                    url.includes('/api/graphql/') || url.includes('query_hash') ||
                    url.includes('comments') || url.includes('edge_media_to_comment') ||
                    (url.includes('instagram.com') && (url.includes('/api/') || url.includes('?query_hash=')))) {
                    try {
                        const responseText = await response.text();
                        if (!responseText || responseText.length < 100) return;
                        
                        // Try to parse as JSON
                        let data: any;
                        try {
                            data = JSON.parse(responseText);
                        } catch {
                            return; // Not JSON, skip
                        }
                        
                        // Extract comments from various Instagram API response formats
                        const comments = this.extractCommentsFromApiResponse(data);
                        for (const comment of comments) {
                            if (comment.username && comment.text) {
                                const key = `${comment.username}:${comment.text.substring(0, 50)}`;
                                if (!capturedComments.has(key)) {
                                    capturedComments.set(key, comment);
                                    lastApiResponseTime.value = Date.now();
                                }
                            }
                        }
                        
                        if (comments.length > 0) {
                            log(`Captured ${comments.length} comments from API (total: ${capturedComments.size})`, "scraper");
                        }
                    } catch (error) {
                        // Silently ignore parsing errors
                    }
                }
            });

            // Navigate directly to the post
            log(`Navigating to post: ${postUrl}`, "scraper");
            await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 30000 });
            await this.randomDelay(2000, 3000);

            // First, click "View all X comments" button if present
            log("Looking for 'View all comments' button...", "scraper");
            const clickedViewAll = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('span, button, div, a'));
                for (const el of elements) {
                    const text = (el.textContent || '').trim();
                    // Match patterns like "View all 2,000 comments" or "View all 156 comments"
                    if (/^View all \d[\d,]* comments?$/i.test(text)) {
                        (el as HTMLElement).click();
                        return text;
                    }
                }
                return null;
            });
            
            if (clickedViewAll) {
                log(`Clicked: "${clickedViewAll}"`, "scraper");
                await this.randomDelay(3000, 4000);
            } else {
                log("No 'View all comments' button found, comments may already be visible", "scraper");
            }

            // Scroll within the comments section quickly (network interception is doing the work)
            log("Scrolling comments section to trigger API calls...", "scraper");
            await this.scrollCommentsSectionFast(page, capturedComments, lastApiResponseTime);

            // Extract comments from DOM as fallback
            log("Extracting comments from DOM (fallback)...", "scraper");
            const domComments = await this.extractComments(page);
            
            // Combine network-captured comments with DOM-extracted ones
            const allComments = Array.from(capturedComments.values());
            for (const domComment of domComments) {
                const key = `${domComment.username}:${domComment.text.substring(0, 50)}`;
                if (!capturedComments.has(key)) {
                    allComments.push(domComment);
                }
            }
            
            const comments = allComments;

            // Get post info
            const postInfo = await page.evaluate(() => {
                // Try to get post ID from URL
                const url = window.location.href;
                const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                const id = match ? match[2] : undefined;

                // Try to get like count
                const likeButton = document.querySelector('button[aria-label*="like"]');
                const likeText = likeButton?.getAttribute('aria-label') || '';
                const likeMatch = likeText.match(/(\d+)/);
                const likeCount = likeMatch ? parseInt(likeMatch[1]) : undefined;

                return {
                    id,
                    likeCount,
                };
            });

            await page.close();

            log(`Extracted ${comments.length} comments`, "scraper");

            return {
                comments,
                total: comments.length,
                postInfo: postInfo.id ? {
                    id: postInfo.id,
                    likeCount: postInfo.likeCount,
                } : undefined,
            };
        } catch (error) {
            log(`Scraping error: ${error}`, "scraper");
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        }
    }

    /**
     * Cleanup resources
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
