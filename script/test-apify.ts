import "dotenv/config";
import { fetchInstagramComments } from "../server/instagram";

async function test() {
    console.log("Testing Apify Comments API...");
    console.log("Token:", process.env.APIFY_TOKEN ? "FOUND" : "MISSING");

    try {
        console.log("Testing Comments Scraper (sample post)...");
        // Using a public post from Instagram's own profile to be sure
        const comments = await fetchInstagramComments("C_6_7Y-C6_7");
        console.log("Comments count returned:", comments.comments.length);
        if (comments.comments.length > 0) {
            console.log("First comment:", comments.comments[0]);
        } else {
            console.log("No comments found. This might be normal if the post has no comments.");
        }
    } catch (e) {
        console.error("API TEST FAILED:", e);
    }
}

test();
