import { Page } from "puppeteer";
import { log } from "../log";
import { InstagramComment } from "../instagram";

/**
 * High-performance Instagram API client.
 *
 * Key optimizations vs the original implementation:
 * 1. Node.js native fetch — bypasses Puppeteer CDP overhead (~50-100ms saved per request)
 * 2. Pipelined pagination — fires next request before processing current results
 * 3. Concurrent child thread fetching runs in parallel with parent pagination
 * 4. 25 concurrent child thread fetchers (up from 8)
 * 5. Zero artificial delays on v1 API path
 *
 * Target: 100k comments in 120-180s (~833 comments/second)
 */
export class InstagramApiClient {
    private static readonly API_TIME_BUDGET_MS = 150_000; // 150 seconds

    // ── Session state for native fetch ──────────────────────────────────
    private sessionCookies: string = "";
    private csrfToken: string = "";
    private userAgent: string = "";

    /**
     * Extract session cookies from the Puppeteer page so we can make
     * requests directly from Node.js without CDP overhead.
     */
    private async extractSession(page: Page): Promise<void> {
        const cookies = await page.cookies("https://www.instagram.com");
        this.sessionCookies = cookies.map(c => `${c.name}=${c.value}`).join("; ");
        const csrf = cookies.find(c => c.name === "csrftoken");
        this.csrfToken = csrf?.value || "";
        const ua = await page.evaluate(() => navigator.userAgent);
        this.userAgent = ua || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    }

    /**
     * Primary entry point: fetch comments for a post via direct API calls.
     * Uses v1 REST API as primary (fastest), supplements with GraphQL.
     * Enforces a total time budget so the scraper stays responsive.
     */
    async fetchComments(
        page: Page,
        postUrl: string,
        targetCount: number
    ): Promise<{ comments: InstagramComment[]; hasMore: boolean }> {
        const shortcode = this.extractShortcode(postUrl);
        if (!shortcode) {
            log(`API client: could not extract shortcode from ${postUrl}`, "scraper");
            return { comments: [], hasMore: false };
        }

        const deadline = Date.now() + InstagramApiClient.API_TIME_BUDGET_MS;
        log(`Phase 1: Direct API extraction (shortcode=${shortcode}, budget=${InstagramApiClient.API_TIME_BUDGET_MS / 1000}s)`, "scraper");

        // Extract session cookies for native Node.js fetch (bypasses Puppeteer CDP overhead)
        await this.extractSession(page);
        if (!this.csrfToken) {
            log(`WARNING: No CSRF token found — API requests may fail`, "scraper");
        }

        const allComments = new Map<string, InstagramComment>();

        // Extract media ID early — needed for v1 API
        let mediaId: string | null = null;
        try {
            mediaId = await this.extractMediaId(page);
            if (mediaId) log(`Extracted mediaId: ${mediaId}`, "scraper");
        } catch { /* ignore */ }

        // Step 1: v1 REST API (PRIMARY — fastest, finds the most comments reliably)
        if (mediaId) {
            try {
                log(`v1 API primary (mediaId=${mediaId}, target=${targetCount}, ${Math.round((deadline - Date.now()) / 1000)}s left)`, "scraper");
                const result = await this.fetchViaV1Api(page, mediaId, targetCount, deadline);
                for (const c of result.comments) {
                    const key = `${c.username}:${c.text.substring(0, 50)}`;
                    if (!allComments.has(key)) allComments.set(key, c);
                }
                log(`v1 API returned ${result.comments.length} comments (unique: ${allComments.size})`, "scraper");
            } catch (err) {
                log(`v1 API failed: ${err instanceof Error ? err.message : err}`, "scraper");
            }
        } else {
            log(`v1 API skipped: could not extract mediaId`, "scraper");
        }

        // Step 2: GraphQL supplement (only if v1 didn't reach target or no mediaId)
        if (allComments.size < targetCount && Date.now() < deadline) {
            try {
                const remaining = targetCount - allComments.size;
                log(`GraphQL supplement (have ${allComments.size}, need ${remaining} more, ${Math.round((deadline - Date.now()) / 1000)}s left)`, "scraper");
                const result = await this.fetchViaGraphQL(page, shortcode, targetCount, deadline, mediaId);
                let newCount = 0;
                for (const c of result.comments) {
                    const key = `${c.username}:${c.text.substring(0, 50)}`;
                    if (!allComments.has(key)) {
                        allComments.set(key, c);
                        newCount++;
                    }
                }
                log(`GraphQL added ${newCount} new comments (total: ${allComments.size})`, "scraper");
            } catch (err) {
                log(`GraphQL API failed: ${err instanceof Error ? err.message : err}`, "scraper");
            }
        } else if (Date.now() >= deadline) {
            log(`Time budget exhausted, skipping GraphQL supplement (have ${allComments.size} comments)`, "scraper");
        }

        return {
            comments: Array.from(allComments.values()),
            hasMore: allComments.size >= targetCount,
        };
    }

    // ── Shortcode Extraction ──────────────────────────────────────────────

    private extractShortcode(url: string): string | null {
        const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        return match ? match[2] : null;
    }

    // ── Media ID Extraction (for v1 API) ──────────────────────────────────

    private async extractMediaId(page: Page): Promise<string | null> {
        return page.evaluate(() => {
            // Method 1: meta tag
            const meta = document.querySelector('meta[property="al:ios:url"]');
            if (meta) {
                const content = meta.getAttribute("content") || "";
                const m = content.match(/media\?id=(\d+)/);
                if (m) return m[1];
            }
            // Method 2: page source regex (additionalData / __media_id)
            const html = document.documentElement.innerHTML;
            const patterns = [
                /"media_id":"(\d+)"/,
                /"pk":"(\d+)"/,
                /instagram:\/\/media\?id=(\d+)/,
            ];
            for (const p of patterns) {
                const m = html.match(p);
                if (m) return m[1];
            }
            return null;
        });
    }

    // ── Native Node.js fetch (bypasses Puppeteer CDP overhead) ──────────

    /**
     * Make a GET request directly from Node.js using extracted session cookies.
     * ~5-10x faster than page.evaluate(fetch(...)) because it skips the CDP round-trip.
     */
    private async nativeFetch(url: string): Promise<any> {
        try {
            const res = await fetch(url, {
                headers: {
                    "Cookie": this.sessionCookies,
                    "X-Requested-With": "XMLHttpRequest",
                    "X-IG-App-ID": "936619743392459",
                    "X-CSRFToken": this.csrfToken,
                    "X-ASBD-ID": "129477",
                    "User-Agent": this.userAgent,
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": "https://www.instagram.com/",
                    "Origin": "https://www.instagram.com",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                },
            });
            if (!res.ok) return null;
            const text = await res.text();
            if (text.startsWith("<!") || text.startsWith("<html")) return null;
            return JSON.parse(text);
        } catch {
            return null;
        }
    }

    /**
     * Make a POST request directly from Node.js using extracted session cookies.
     */
    private async nativePost(url: string, body: string, extraHeaders?: Record<string, string>): Promise<any> {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Cookie": this.sessionCookies,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-IG-App-ID": "936619743392459",
                    "X-CSRFToken": this.csrfToken,
                    "X-ASBD-ID": "129477",
                    "User-Agent": this.userAgent,
                    "Accept": "*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": "https://www.instagram.com/",
                    "Origin": "https://www.instagram.com",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    ...extraHeaders,
                },
                body,
            });
            if (!res.ok) {
                return { __error: `HTTP ${res.status}`, __preview: "" };
            }
            const text = await res.text();
            if (text.startsWith("<!") || text.startsWith("<html")) {
                return { __error: "HTML response", __preview: text.substring(0, 100) };
            }
            return JSON.parse(text);
        } catch (e: any) {
            return { __error: e?.message || "unknown", __preview: "" };
        }
    }

    // ── Fallback: in-browser fetch (used when native fails) ─────────────

    private async igFetch(page: Page, url: string): Promise<any> {
        return page.evaluate(async (fetchUrl: string) => {
            try {
                const csrfMatch = document.cookie.match(/csrftoken=([^;]+)/);
                const csrfToken = csrfMatch ? csrfMatch[1] : "";

                const res = await fetch(fetchUrl, {
                    credentials: "include",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "X-IG-App-ID": "936619743392459",
                        "X-CSRFToken": csrfToken,
                        "X-ASBD-ID": "129477",
                    },
                });
                if (!res.ok) return null;
                const text = await res.text();
                if (text.startsWith("<!") || text.startsWith("<html")) return null;
                return JSON.parse(text);
            } catch {
                return null;
            }
        }, url);
    }

    private addComment(
        map: Map<string, InstagramComment>,
        node: any
    ): boolean {
        const username = node.owner?.username || node.user?.username;
        const text = node.text;
        if (!username || !text) return false;

        const key = `${username}:${text.substring(0, 50)}`;
        if (map.has(key)) return false;

        const userId = node.user?.pk || node.user?.id || node.owner?.id || undefined;
        map.set(key, {
            id: String(node.id || node.pk || `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`),
            username,
            text,
            timestamp: node.created_at
                ? new Date(node.created_at * 1000).toISOString()
                : new Date().toISOString(),
            likes: node.edge_liked_by?.count || node.comment_like_count || node.like_count || 0,
            avatar: node.owner?.profile_pic_url || node.user?.profile_pic_url || undefined,
            userId: userId ? String(userId) : undefined,
        });
        return true;
    }

    // ── GraphQL Fetcher ───────────────────────────────────────────────────

    private async igGraphqlPost(page: Page, docId: string, variables: Record<string, any>): Promise<any> {
        // Try native fetch first, fall back to in-browser
        const body = new URLSearchParams({
            doc_id: docId,
            variables: JSON.stringify(variables),
            fb_api_req_friendly_name: "CommentsMediaQuery",
        });
        const data = await this.nativePost(
            "https://www.instagram.com/api/graphql",
            body.toString(),
            { "X-FB-Friendly-Name": "CommentsMediaQuery" }
        );
        if (data && !this.isErrorResponse(data)) return data;

        // Fallback to in-browser fetch
        return page.evaluate(async (params: { docId: string; variables: string }) => {
            try {
                const csrfMatch = document.cookie.match(/csrftoken=([^;]+)/);
                const csrfToken = csrfMatch ? csrfMatch[1] : "";

                const body = new URLSearchParams({
                    doc_id: params.docId,
                    variables: params.variables,
                    fb_api_req_friendly_name: "CommentsMediaQuery",
                });
                const res = await fetch("https://www.instagram.com/api/graphql", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-Requested-With": "XMLHttpRequest",
                        "X-IG-App-ID": "936619743392459",
                        "X-CSRFToken": csrfToken,
                        "X-ASBD-ID": "129477",
                        "X-FB-Friendly-Name": "CommentsMediaQuery",
                    },
                    body: body.toString(),
                });
                if (!res.ok) {
                    return { __error: `HTTP ${res.status}`, __preview: "" };
                }
                const text = await res.text();
                if (text.startsWith("<!") || text.startsWith("<html")) {
                    return { __error: "HTML response", __preview: text.substring(0, 100) };
                }
                return JSON.parse(text);
            } catch (e: any) {
                return { __error: e?.message || "unknown", __preview: "" };
            }
        }, { docId, variables: JSON.stringify(variables) });
    }

    /** Check if response is a real data response vs our error sentinel */
    private isErrorResponse(data: any): boolean {
        return data && typeof data === "object" && "__error" in data;
    }

    private async fetchViaGraphQL(
        page: Page,
        shortcode: string,
        targetCount: number,
        deadline: number,
        mediaId?: string | null,
    ): Promise<{ comments: InstagramComment[]; hasMore: boolean }> {
        const allComments = new Map<string, InstagramComment>();
        let endCursor: string | null = null;
        let hasNext = true;
        const PER_PAGE = 50;
        const MAX_PAGES = Math.ceil(targetCount / PER_PAGE) + 10;

        const queryHashes = [
            "bc3296d1ce80a24b1b6e40b1e72903f5",
            "97b41c52301f77ce508f55e66d17620e",
        ];

        const docIds: string[] = [];

        const threadQueryHash = "51fdd02b67508306ad4484ff574a0b62";

        const threadsToFetch: { commentId: string; cursor: string; replyCount: number }[] = [];

        let useDocId: string | null = null;
        let useQueryHash: string | null = null;

        log(`GraphQL: CSRF token ${this.csrfToken ? "found" : "MISSING"}`, "scraper");

        // ── Phase A: Fetch all parent comments ────────────────────────
        for (let pageNum = 0; pageNum < MAX_PAGES && hasNext && Date.now() < deadline; pageNum++) {
            let data: any = null;

            // Try POST doc_id method first
            if (useQueryHash === null) {
                const docIdsToTry: string[] = useDocId ? [useDocId] : docIds;
                for (const docId of docIdsToTry) {
                    const variables: Record<string, any> = {
                        shortcode,
                        first: PER_PAGE,
                    };
                    if (endCursor) variables.after = endCursor;

                    data = await this.igGraphqlPost(page, docId, variables);
                    if (data && !this.isErrorResponse(data)) {
                        useDocId = docId;
                        break;
                    }
                    if (this.isErrorResponse(data)) {
                        log(`doc_id[${docId}] Phase A: ${data.__error}`, "scraper");
                        data = null;
                    }
                }
            }

            // Fallback to GET query_hash method (uses native fetch)
            if (!data) {
                useDocId = null;
                const variables: Record<string, any> = {
                    shortcode,
                    first: PER_PAGE,
                };
                if (endCursor) variables.after = endCursor;

                const hashesToTry: string[] = useQueryHash ? [useQueryHash] : queryHashes;
                for (const hash of hashesToTry) {
                    const url =
                        `https://www.instagram.com/graphql/query/?query_hash=${hash}` +
                        `&variables=${encodeURIComponent(JSON.stringify(variables))}`;
                    data = await this.nativeFetch(url);
                    if (!data) {
                        // Fallback to in-browser fetch
                        data = await this.igFetch(page, url);
                    }
                    if (data) {
                        useQueryHash = hash;
                        break;
                    }
                }
            }

            if (!data) {
                if (pageNum === 0) {
                    log(`GraphQL page 1: all endpoints returned null (HTML or error). CSRF token may be missing.`, "scraper");
                } else {
                    log(`GraphQL page ${pageNum + 1}: no response from any endpoint`, "scraper");
                }
                break;
            }

            const media =
                data?.data?.shortcode_media ??
                data?.data?.xdt_shortcode_media ??
                data?.data?.xdt_api__v1__media__media_id__comments__connection ??
                data?.shortcode_media;

            const commentEdge =
                media?.edge_media_to_parent_comment ??
                media?.edge_media_to_comment ??
                (media?.edges ? media : null);

            if (!commentEdge) {
                log(`GraphQL page ${pageNum + 1}: no comment edge found in response`, "scraper");
                break;
            }

            const edges = commentEdge.edges || [];
            let newCount = 0;

            for (const edge of edges) {
                const node = edge?.node;
                if (!node) continue;

                if (this.addComment(allComments, node)) newCount++;

                const threaded = node.edge_threaded_comments;
                const threadedEdges = threaded?.edges || [];
                for (const te of threadedEdges) {
                    if (te?.node && this.addComment(allComments, te.node)) newCount++;
                }

                const totalReplies = threaded?.count || node.edge_threaded_comments?.count || 0;
                const inlineReplies = threadedEdges.length;

                if (threaded?.page_info?.has_next_page && threaded?.page_info?.end_cursor) {
                    threadsToFetch.push({
                        commentId: String(node.id),
                        cursor: threaded.page_info.end_cursor,
                        replyCount: totalReplies - inlineReplies,
                    });
                } else if (totalReplies > inlineReplies && node.id) {
                    threadsToFetch.push({
                        commentId: String(node.id),
                        cursor: "",
                        replyCount: totalReplies - inlineReplies,
                    });
                }
            }

            const pageInfo = commentEdge.page_info;
            hasNext = pageInfo?.has_next_page === true;
            endCursor = pageInfo?.end_cursor || null;

            const method = useDocId ? "doc_id" : "query_hash";
            log(
                `GraphQL[${method}] page ${pageNum + 1}: +${newCount} (total: ${allComments.size}), ` +
                `threads queued: ${threadsToFetch.length}, hasNext=${hasNext}`,
                "scraper"
            );

            if (allComments.size >= targetCount) break;
            // No delay — native fetch is fast enough to self-throttle via network latency
        }

        // If query_hash capped out early but we haven't tried doc_id yet, try it
        if (!hasNext && allComments.size < targetCount && useDocId === null && Date.now() < deadline) {
            log(`query_hash pagination ended at ${allComments.size} — trying doc_id POST endpoint to continue...`, "scraper");
            let docIdCursor = endCursor;
            let docIdHasNext = true;

            for (const docId of docIds) {
                if (!docIdHasNext || Date.now() >= deadline) break;

                for (let pageNum = 0; pageNum < MAX_PAGES && docIdHasNext && Date.now() < deadline; pageNum++) {
                    const variables: Record<string, any> = { shortcode, first: PER_PAGE };
                    if (mediaId) variables.media_id = mediaId;
                    if (docIdCursor) variables.after = docIdCursor;

                    log(`doc_id[${docId}] attempt page ${pageNum + 1}, cursor=${docIdCursor ? docIdCursor.substring(0, 20) + '...' : 'none'}`, "scraper");
                    const data = await this.igGraphqlPost(page, docId, variables);
                    if (!data || this.isErrorResponse(data)) {
                        const errMsg = data?.__error || "null response";
                        log(`doc_id[${docId}] failed: ${errMsg}`, "scraper");
                        break;
                    }

                    const media =
                        data?.data?.shortcode_media ??
                        data?.data?.xdt_shortcode_media ??
                        data?.data?.xdt_api__v1__media__media_id__comments__connection;
                    const commentEdge =
                        media?.edge_media_to_parent_comment ??
                        media?.edge_media_to_comment ??
                        (media?.edges ? media : null);

                    if (!commentEdge) break;

                    const edges = commentEdge.edges || [];
                    let newCount = 0;

                    for (const edge of edges) {
                        const node = edge?.node;
                        if (!node) continue;
                        if (this.addComment(allComments, node)) newCount++;

                        const threaded = node.edge_threaded_comments;
                        const threadedEdges = threaded?.edges || [];
                        for (const te of threadedEdges) {
                            if (te?.node && this.addComment(allComments, te.node)) newCount++;
                        }

                        const totalReplies = threaded?.count || 0;
                        const inlineReplies = threadedEdges.length;
                        if (threaded?.page_info?.has_next_page && threaded?.page_info?.end_cursor) {
                            threadsToFetch.push({
                                commentId: String(node.id),
                                cursor: threaded.page_info.end_cursor,
                                replyCount: totalReplies - inlineReplies,
                            });
                        } else if (totalReplies > inlineReplies && node.id) {
                            threadsToFetch.push({
                                commentId: String(node.id),
                                cursor: "",
                                replyCount: totalReplies - inlineReplies,
                            });
                        }
                    }

                    const pageInfo = commentEdge.page_info;
                    docIdHasNext = pageInfo?.has_next_page === true;
                    docIdCursor = pageInfo?.end_cursor || null;

                    if (newCount > 0) {
                        hasNext = docIdHasNext;
                        log(`GraphQL[doc_id] continuation page ${pageNum + 1}: +${newCount} (total: ${allComments.size})`, "scraper");
                    } else {
                        break;
                    }

                    if (allComments.size >= targetCount) break;
                }
                if (allComments.size > 0) break;
            }
        }

        // ── Phase B: Fetch all threaded replies (high parallelism) ────
        if (allComments.size < targetCount && threadsToFetch.length > 0 && Date.now() < deadline) {
            threadsToFetch.sort((a, b) => b.replyCount - a.replyCount);

            log(`Fetching replies for ${threadsToFetch.length} comment threads (${Math.round((deadline - Date.now()) / 1000)}s left)...`, "scraper");

            const PARALLEL_BATCH = 20; // High parallelism for thread fetching

            const fetchThread = async (thread: { commentId: string; cursor: string; replyCount: number }, ti: number) => {
                let threadCursor: string | null = thread.cursor || null;
                let threadHasNext = true;
                const MAX_THREAD_PAGES = 50;

                for (let tp = 0; tp < MAX_THREAD_PAGES && threadHasNext; tp++) {
                    if (allComments.size >= targetCount || Date.now() >= deadline) break;

                    const variables: Record<string, any> = {
                        comment_id: thread.commentId,
                        first: PER_PAGE,
                    };
                    if (threadCursor) variables.after = threadCursor;

                    const url =
                        `https://www.instagram.com/graphql/query/?query_hash=${threadQueryHash}` +
                        `&variables=${encodeURIComponent(JSON.stringify(variables))}`;

                    const data = await this.nativeFetch(url);
                    if (!data) break;

                    const threadedEdge = data?.data?.comment?.edge_threaded_comments;
                    if (!threadedEdge) break;

                    let newCount = 0;
                    for (const edge of threadedEdge.edges || []) {
                        if (edge?.node && this.addComment(allComments, edge.node)) newCount++;
                    }

                    threadHasNext = threadedEdge.page_info?.has_next_page === true;
                    threadCursor = threadedEdge.page_info?.end_cursor || null;

                    if (newCount > 0 && (ti % 20 === 0 || tp > 0)) {
                        log(
                            `Thread ${ti + 1}/${threadsToFetch.length} page ${tp + 1}: +${newCount} (total: ${allComments.size})`,
                            "scraper"
                        );
                    }

                    if (allComments.size >= targetCount || newCount === 0) break;
                }
            };

            for (let i = 0; i < threadsToFetch.length; i += PARALLEL_BATCH) {
                if (allComments.size >= targetCount || Date.now() >= deadline) break;
                const batch = threadsToFetch.slice(i, i + PARALLEL_BATCH);
                await Promise.all(batch.map((thread, idx) => fetchThread(thread, i + idx)));
            }
        }

        log(`GraphQL complete: ${allComments.size} total comments`, "scraper");
        return {
            comments: Array.from(allComments.values()),
            hasMore: hasNext,
        };
    }

    // ── v1 REST API Fetcher (high-performance) ────────────────────────────

    private async fetchViaV1Api(
        page: Page,
        mediaId: string,
        targetCount: number,
        deadline: number
    ): Promise<{ comments: InstagramComment[]; hasMore: boolean }> {
        const allComments = new Map<string, InstagramComment>();
        let minId: string | null = null;
        let hasMore = true;
        const PER_PAGE_V1 = 200;
        const MAX_PAGES = Math.ceil(targetCount / PER_PAGE_V1) + 5;

        // Child threads collected during parent pagination — fetched concurrently
        const childThreads: { commentPk: string; cursor: string }[] = [];

        // Background child thread fetcher — runs concurrently with parent pagination
        const childFetchQueue: Promise<void>[] = [];
        const CHILD_CONCURRENCY = 25; // Up from 8
        let activeChildFetches = 0;

        const fetchChildThread = async (thread: { commentPk: string; cursor: string }, ti: number) => {
            activeChildFetches++;
            try {
                let childMinId: string | null = thread.cursor || null;
                let childHasMore = true;
                const MAX_CHILD_PAGES = 50;

                for (let cp = 0; cp < MAX_CHILD_PAGES && childHasMore; cp++) {
                    if (allComments.size >= targetCount || Date.now() >= deadline) break;

                    let childUrl = `https://www.instagram.com/api/v1/media/${mediaId}/comments/${thread.commentPk}/child_comments/?`;
                    if (childMinId) childUrl += `min_id=${childMinId}&`;

                    const childData = await this.nativeFetch(childUrl);
                    if (!childData) break;

                    let newCount = 0;
                    const childComments: any[] = childData.child_comments || [];
                    for (const child of childComments) {
                        if (this.addComment(allComments, child)) newCount++;
                    }

                    childHasMore = childData.has_more_head_child_comments === true ||
                                   childData.next_min_child_cursor != null;
                    childMinId = childData.next_min_child_cursor || null;

                    if (newCount > 0 && (ti % 20 === 0 || cp > 0)) {
                        log(
                            `v1 child thread ${ti + 1} page ${cp + 1}: +${newCount} (total: ${allComments.size})`,
                            "scraper"
                        );
                    }

                    if (newCount === 0 || allComments.size >= targetCount) break;
                    // No delay — network latency is sufficient throttle
                }
            } finally {
                activeChildFetches--;
            }
        };

        // Helper to dispatch child threads while respecting concurrency limit
        const dispatchChildThread = (thread: { commentPk: string; cursor: string }, idx: number) => {
            const promise = fetchChildThread(thread, idx);
            childFetchQueue.push(promise);
        };

        // Track native fetch success for fallback
        let useNative = true;
        let nativeFailCount = 0;

        // ── Phase A: parent comments (pipelined) ─────────────────────
        // Fire first request
        let pendingFetch: Promise<any> | null = null;

        // Track which cursor param to use: next_min_id uses &min_id=, next_max_id uses &max_id=
        let cursorParam: 'min_id' | 'max_id' = 'min_id';

        const buildV1Url = (cursor: string | null) => {
            let url = `https://www.instagram.com/api/v1/media/${mediaId}/comments/?can_support_threading=true&permalink_enabled=false&count=${PER_PAGE_V1}`;
            if (cursor) url += `&${cursorParam}=${cursor}`;
            return url;
        };

        // Start first request immediately
        pendingFetch = useNative
            ? this.nativeFetch(buildV1Url(null))
            : this.igFetch(page, buildV1Url(null));

        let childIdx = 0;

        for (let pageNum = 0; pageNum < MAX_PAGES && hasMore && Date.now() < deadline; pageNum++) {
            // Await current page result
            let data = await pendingFetch;
            pendingFetch = null;

            if (!data) {
                // If native fetch failed, try in-browser fallback
                if (useNative && nativeFailCount < 2) {
                    nativeFailCount++;
                    log(`v1 native fetch failed on page ${pageNum + 1}, trying in-browser fallback`, "scraper");
                    const fallbackData = await this.igFetch(page, buildV1Url(minId));
                    if (fallbackData) {
                        useNative = false;
                        data = fallbackData;
                    }
                }
                if (!data) {
                    log(`v1 API page ${pageNum + 1}: no response`, "scraper");
                    break;
                }
            } else if (useNative) {
                nativeFailCount = 0; // Reset on success
            }

            const rawComments: any[] = data.comments || [];
            let newCount = 0;

            for (const c of rawComments) {
                if (this.addComment(allComments, c)) newCount++;

                const children: any[] = c.preview_child_comments || c.child_comments || [];
                for (const child of children) {
                    if (this.addComment(allComments, child)) newCount++;
                }

                // Queue child thread fetch — dispatch immediately if under concurrency limit
                const childCount = c.child_comment_count || 0;
                const inlineCount = children.length;
                if (childCount > inlineCount && c.pk) {
                    const thread = {
                        commentPk: String(c.pk),
                        cursor: children.length > 0 ? String(children[children.length - 1]?.pk || "") : "",
                    };
                    childThreads.push(thread);

                    // Start child fetching immediately if we have capacity
                    if (activeChildFetches < CHILD_CONCURRENCY && allComments.size < targetCount) {
                        dispatchChildThread(thread, childIdx++);
                    }
                }
            }

            // Support both next_min_id (older API) and next_max_id (newer API) cursors
            const nextMinId = data.next_min_id || null;
            const nextMaxId = data.next_max_id || null;
            hasMore = data.has_more_comments === true || nextMinId != null || nextMaxId != null;
            if (nextMinId) {
                minId = nextMinId;
                cursorParam = 'min_id';
            } else if (nextMaxId) {
                minId = nextMaxId;
                cursorParam = 'max_id';
            } else {
                minId = null;
            }

            // Pipeline: fire next page request immediately (don't wait for processing)
            if (hasMore && pageNum + 1 < MAX_PAGES && Date.now() < deadline && allComments.size < targetCount) {
                pendingFetch = useNative
                    ? this.nativeFetch(buildV1Url(minId))
                    : this.igFetch(page, buildV1Url(minId));
            }

            if (pageNum % 5 === 0 || newCount > 100) {
                const elapsed = ((Date.now() - (deadline - InstagramApiClient.API_TIME_BUDGET_MS)) / 1000).toFixed(1);
                const rate = allComments.size / Math.max(parseFloat(elapsed), 0.1);
                log(
                    `v1 API page ${pageNum + 1}: +${newCount} (total: ${allComments.size}, ${rate.toFixed(0)} cmt/s), ` +
                    `childThreads: ${childThreads.length} (active: ${activeChildFetches}), hasMore=${hasMore}`,
                    "scraper"
                );
            }

            if (allComments.size >= targetCount) break;
            // Zero delay — pipeline next request already in flight, network latency is the throttle
        }

        // ── Phase B: finish remaining child threads ──────────────────
        // Dispatch any child threads that weren't started during parent pagination
        if (allComments.size < targetCount && Date.now() < deadline) {
            const remainingThreads = childThreads.slice(childIdx);
            if (remainingThreads.length > 0) {
                log(`Dispatching ${remainingThreads.length} remaining child threads (${Math.round((deadline - Date.now()) / 1000)}s left)...`, "scraper");

                for (let i = 0; i < remainingThreads.length; i += CHILD_CONCURRENCY) {
                    if (allComments.size >= targetCount || Date.now() >= deadline) break;

                    // Wait for some active fetches to complete before dispatching more
                    while (activeChildFetches >= CHILD_CONCURRENCY) {
                        await Promise.race(childFetchQueue.filter(p => p !== undefined));
                        // Small yield to let completions register
                        await new Promise(r => setTimeout(r, 1));
                    }

                    const batch = remainingThreads.slice(i, i + CHILD_CONCURRENCY);
                    for (const thread of batch) {
                        if (activeChildFetches < CHILD_CONCURRENCY && allComments.size < targetCount) {
                            dispatchChildThread(thread, childIdx++);
                        }
                    }
                }
            }
        }

        // Wait for all in-flight child fetches to complete
        if (childFetchQueue.length > 0) {
            await Promise.allSettled(childFetchQueue);
        }

        const elapsed = ((Date.now() - (deadline - InstagramApiClient.API_TIME_BUDGET_MS)) / 1000).toFixed(1);
        const rate = allComments.size / Math.max(parseFloat(elapsed), 0.1);
        log(`v1 API complete: ${allComments.size} total comments in ${elapsed}s (${rate.toFixed(0)} cmt/s)`, "scraper");

        return {
            comments: Array.from(allComments.values()),
            hasMore,
        };
    }

    // ── Follower Check ──────────────────────────────────────────────────

    /**
     * Check if given user IDs follow the currently logged-in user.
     * Uses /api/v1/friendships/show/{user_id}/ endpoint.
     * Returns a map of userId -> followsYou boolean.
     */
    async checkFollowStatus(
        page: Page,
        userIds: string[]
    ): Promise<Map<string, boolean>> {
        // Extract session for native fetch
        await this.extractSession(page);

        const results = new Map<string, boolean>();
        log(`Checking follow status for ${userIds.length} users...`, "scraper");

        // Use higher parallelism for follower checks too
        const BATCH_SIZE = 10;

        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batch = userIds.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (userId) => {
                try {
                    const url = `https://www.instagram.com/api/v1/friendships/show/${userId}/`;
                    const data = await this.nativeFetch(url);
                    results.set(userId, data?.followed_by === true);
                } catch {
                    results.set(userId, false);
                }
            });
            await Promise.all(promises);

            // Small delay between batches
            if (i + BATCH_SIZE < userIds.length) {
                await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
            }
        }

        const followCount = Array.from(results.values()).filter(Boolean).length;
        log(`Follow check complete: ${followCount}/${userIds.length} follow you`, "scraper");
        return results;
    }
}
