import { Page } from "puppeteer";
import { log } from "../log";
import { InstagramComment } from "../instagram";

/**
 * Direct Instagram GraphQL/API client.
 * Runs fetch() inside the browser page context so session cookies are included
 * automatically — no need to extract or manage cookies manually.
 */
export class InstagramApiClient {
    // Maximum time (ms) to spend on API calls before returning what we have
    // Raised to 150s to support fetching large posts (34k+ comments) within the 3-minute window
    private static readonly API_TIME_BUDGET_MS = 150_000; // 150 seconds

    /**
     * Primary entry point: fetch comments for a post via direct API calls.
     * Uses GraphQL as primary (fastest), supplements with v1 REST API.
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

        // Accumulate comments across both API methods
        const allComments = new Map<string, InstagramComment>();

        // Extract media ID early — needed for v1 API (primary) and doc_id POST fallback
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

    // ── Shared fetch helper ─────────────────────────────────────────────

    private async igFetch(page: Page, url: string): Promise<any> {
        return page.evaluate(async (fetchUrl: string) => {
            try {
                // Extract CSRF token from cookies
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
                // Guard against HTML responses (login/consent pages)
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

    // ── GraphQL POST helper (newer Instagram API format) ─────────────

    private async igGraphqlPost(page: Page, docId: string, variables: Record<string, any>): Promise<any> {
        return page.evaluate(async (params: { docId: string; variables: string }) => {
            try {
                // Extract CSRF token from cookies
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
                // Guard against HTML responses (login/consent pages)
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
        // Allow enough pages to reach targetCount; deadline will enforce the time limit
        const MAX_PAGES = Math.ceil(targetCount / PER_PAGE) + 10;

        // Query hashes (GET) for parent comments — older but still working
        const queryHashes = [
            "bc3296d1ce80a24b1b6e40b1e72903f5",
            "97b41c52301f77ce508f55e66d17620e",
        ];

        // doc_ids (POST) for parent comments — newer Instagram API, better pagination
        // NOTE: These currently return HTML responses; kept for future use if Instagram fixes them
        const docIds: string[] = [
            // "8845758582119845",  // xdt_api__v1__media__media_id__comments__connection
            // "7585356228199498",  // CommentsMediaQuery
        ];

        // Query hash for threaded (reply) comments
        const threadQueryHash = "51fdd02b67508306ad4484ff574a0b62";

        // Collect parent comment IDs that have more replies to fetch
        const threadsToFetch: { commentId: string; cursor: string; replyCount: number }[] = [];

        // Track which method works so we can stick with it
        let useDocId: string | null = null;
        let useQueryHash: string | null = null;

        // Check if CSRF token is available before starting
        const hasCsrf = await page.evaluate(() => {
            return document.cookie.includes("csrftoken=");
        });
        log(`GraphQL: CSRF token ${hasCsrf ? "found" : "MISSING"} in cookies`, "scraper");

        // ── Phase A: Fetch all parent comments ────────────────────────
        for (let pageNum = 0; pageNum < MAX_PAGES && hasNext && Date.now() < deadline; pageNum++) {
            let data: any = null;

            // Try POST doc_id method first (newer, better pagination)
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

            // Fallback to GET query_hash method
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
                    data = await this.igFetch(page, url);
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

            // Extract comment data from various response shapes
            const media =
                data?.data?.shortcode_media ??
                data?.data?.xdt_shortcode_media ??
                data?.data?.xdt_api__v1__media__media_id__comments__connection ??
                data?.shortcode_media;

            // The newer API puts comments at the top level of the connection
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

                // Grab preview threaded replies included inline
                const threaded = node.edge_threaded_comments;
                const threadedEdges = threaded?.edges || [];
                for (const te of threadedEdges) {
                    if (te?.node && this.addComment(allComments, te.node)) newCount++;
                }

                // Queue thread fetch when more replies exist
                const totalReplies = threaded?.count || node.edge_threaded_comments?.count || 0;
                const inlineReplies = threadedEdges.length;

                if (threaded?.page_info?.has_next_page && threaded?.page_info?.end_cursor) {
                    threadsToFetch.push({
                        commentId: String(node.id),
                        cursor: threaded.page_info.end_cursor,
                        replyCount: totalReplies - inlineReplies,
                    });
                } else if (totalReplies > inlineReplies && node.id) {
                    // Queue even without cursor — we'll fetch from the beginning
                    threadsToFetch.push({
                        commentId: String(node.id),
                        cursor: "",
                        replyCount: totalReplies - inlineReplies,
                    });
                }
            }

            // Pagination for parent comments
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
            await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
        }

        // If query_hash capped out early but we haven't tried doc_id yet, try it
        if (!hasNext && allComments.size < targetCount && useDocId === null && Date.now() < deadline) {
            log(`query_hash pagination ended at ${allComments.size} — trying doc_id POST endpoint to continue...`, "scraper");
            let docIdCursor = endCursor;
            let docIdHasNext = true;

            for (const docId of docIds) {
                if (!docIdHasNext || Date.now() >= deadline) break;

                for (let pageNum = 0; pageNum < MAX_PAGES && docIdHasNext && Date.now() < deadline; pageNum++) {
                    // Try both shortcode and media_id variable formats
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
                        break; // doc_id returned same data, stop
                    }

                    if (allComments.size >= targetCount) break;
                    await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
                }
                if (allComments.size > 0) break; // found a working doc_id
            }
        }

        // ── Phase B: Fetch all threaded replies ───────────────────────
        if (allComments.size < targetCount && threadsToFetch.length > 0 && Date.now() < deadline) {
            // Sort by reply count descending — fetch threads with most replies first
            threadsToFetch.sort((a, b) => b.replyCount - a.replyCount);

            log(`Fetching replies for ${threadsToFetch.length} comment threads (${Math.round((deadline - Date.now()) / 1000)}s left)...`, "scraper");

            for (let ti = 0; ti < threadsToFetch.length; ti++) {
                if (allComments.size >= targetCount || Date.now() >= deadline) break;

                const thread = threadsToFetch[ti];
                let threadCursor: string | null = thread.cursor || null;
                let threadHasNext = true;
                const MAX_THREAD_PAGES = 50;

                for (let tp = 0; tp < MAX_THREAD_PAGES && threadHasNext; tp++) {
                    if (Date.now() >= deadline) break;

                    const variables: Record<string, any> = {
                        comment_id: thread.commentId,
                        first: PER_PAGE,
                    };
                    if (threadCursor) variables.after = threadCursor;

                    const url =
                        `https://www.instagram.com/graphql/query/?query_hash=${threadQueryHash}` +
                        `&variables=${encodeURIComponent(JSON.stringify(variables))}`;

                    const data = await this.igFetch(page, url);
                    if (!data) break;

                    const threadedEdge =
                        data?.data?.comment?.edge_threaded_comments;
                    if (!threadedEdge) break;

                    let newCount = 0;
                    for (const edge of threadedEdge.edges || []) {
                        if (edge?.node && this.addComment(allComments, edge.node)) newCount++;
                    }

                    threadHasNext = threadedEdge.page_info?.has_next_page === true;
                    threadCursor = threadedEdge.page_info?.end_cursor || null;

                    if (newCount > 0 && (ti % 10 === 0 || tp > 0)) {
                        log(
                            `Thread ${ti + 1}/${threadsToFetch.length} page ${tp + 1}: +${newCount} (total: ${allComments.size})`,
                            "scraper"
                        );
                    }

                    if (allComments.size >= targetCount || newCount === 0) break;
                    await new Promise((r) => setTimeout(r, 15 + Math.random() * 20));
                }
            }
        }

        log(`GraphQL complete: ${allComments.size} total comments`, "scraper");
        return {
            comments: Array.from(allComments.values()),
            hasMore: hasNext,
        };
    }

    // ── v1 REST API Fetcher ───────────────────────────────────────────────

    private async fetchViaV1Api(
        page: Page,
        mediaId: string,
        targetCount: number,
        deadline: number
    ): Promise<{ comments: InstagramComment[]; hasMore: boolean }> {
        const allComments = new Map<string, InstagramComment>();
        let minId: string | null = null;
        let hasMore = true;
        // Larger page size = fewer round trips = faster throughput (>100 comments/s)
        const PER_PAGE_V1 = 200;
        const MAX_PAGES = Math.ceil(targetCount / PER_PAGE_V1) + 5;

        // Collect parent comment PKs with more child comments to fetch
        const childThreads: { commentPk: string; cursor: string }[] = [];

        // ── Phase A: parent comments ──────────────────────────────────
        for (let pageNum = 0; pageNum < MAX_PAGES && hasMore && Date.now() < deadline; pageNum++) {
            let apiUrl = `https://www.instagram.com/api/v1/media/${mediaId}/comments/?can_support_threading=true&permalink_enabled=false&count=${PER_PAGE_V1}`;
            if (minId) apiUrl += `&min_id=${minId}`;

            const data = await this.igFetch(page, apiUrl);

            if (!data) {
                log(`v1 API page ${pageNum + 1}: no response`, "scraper");
                break;
            }

            const rawComments: any[] = data.comments || [];
            let newCount = 0;

            for (const c of rawComments) {
                if (this.addComment(allComments, c)) newCount++;

                // Grab inline preview child comments
                const children: any[] = c.preview_child_comments || c.child_comments || [];
                for (const child of children) {
                    if (this.addComment(allComments, child)) newCount++;
                }

                // Queue full child thread fetch if there are more replies
                const childCount = c.child_comment_count || 0;
                const inlineCount = children.length;
                if (childCount > inlineCount && c.pk) {
                    childThreads.push({
                        commentPk: String(c.pk),
                        cursor: children.length > 0 ? String(children[children.length - 1]?.pk || "") : "",
                    });
                }
            }

            hasMore = data.has_more_comments === true || data.next_min_id != null;
            minId = data.next_min_id || null;

            log(
                `v1 API page ${pageNum + 1}: +${newCount} comments (total: ${allComments.size}), ` +
                `childThreads queued: ${childThreads.length}, hasMore=${hasMore}`,
                "scraper"
            );

            if (allComments.size >= targetCount) break;
            // Minimal delay — enough to avoid immediate rate-limit but maximize throughput
            await new Promise((r) => setTimeout(r, 15 + Math.random() * 20));
        }

        // ── Phase B: fetch child comment threads in parallel batches ──
        if (allComments.size < targetCount && childThreads.length > 0 && Date.now() < deadline) {
            log(`Fetching child replies for ${childThreads.length} threads via v1 API in parallel (${Math.round((deadline - Date.now()) / 1000)}s left)...`, "scraper");

            const PARALLEL_BATCH = 8; // fetch up to 8 child threads concurrently

            const fetchChildThread = async (thread: { commentPk: string; cursor: string }, ti: number) => {
                let childMinId: string | null = thread.cursor || null;
                let childHasMore = true;
                const MAX_CHILD_PAGES = 50;

                for (let cp = 0; cp < MAX_CHILD_PAGES && childHasMore; cp++) {
                    if (allComments.size >= targetCount || Date.now() >= deadline) break;

                    let childUrl = `https://www.instagram.com/api/v1/media/${mediaId}/comments/${thread.commentPk}/child_comments/?`;
                    if (childMinId) childUrl += `min_id=${childMinId}&`;

                    const childData = await this.igFetch(page, childUrl);
                    if (!childData) break;

                    let newCount = 0;
                    const childComments: any[] = childData.child_comments || [];
                    for (const child of childComments) {
                        if (this.addComment(allComments, child)) newCount++;
                    }

                    childHasMore = childData.has_more_head_child_comments === true ||
                                   childData.next_min_child_cursor != null;
                    childMinId = childData.next_min_child_cursor || null;

                    if (newCount > 0 && (ti % 10 === 0 || cp > 0)) {
                        log(
                            `v1 child thread ${ti + 1}/${childThreads.length} page ${cp + 1}: +${newCount} (total: ${allComments.size})`,
                            "scraper"
                        );
                    }

                    if (newCount === 0 || allComments.size >= targetCount) break;
                    await new Promise((r) => setTimeout(r, 10 + Math.random() * 15));
                }
            };

            for (let i = 0; i < childThreads.length; i += PARALLEL_BATCH) {
                if (allComments.size >= targetCount || Date.now() >= deadline) break;
                const batch = childThreads.slice(i, i + PARALLEL_BATCH);
                await Promise.all(batch.map((thread, idx) => fetchChildThread(thread, i + idx)));
            }
        }

        log(`v1 API complete: ${allComments.size} total comments`, "scraper");
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
        const results = new Map<string, boolean>();
        log(`Checking follow status for ${userIds.length} users...`, "scraper");

        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            try {
                const url = `https://www.instagram.com/api/v1/friendships/show/${userId}/`;
                const data = await this.igFetch(page, url);

                if (data) {
                    results.set(userId, data.followed_by === true);
                } else {
                    results.set(userId, false);
                }
            } catch {
                results.set(userId, false);
            }

            // Small delay between requests to avoid rate limiting
            if (i < userIds.length - 1) {
                await new Promise((r) => setTimeout(r, 30 + Math.random() * 70));
            }
        }

        const followCount = Array.from(results.values()).filter(Boolean).length;
        log(`Follow check complete: ${followCount}/${userIds.length} follow you`, "scraper");
        return results;
    }
}
