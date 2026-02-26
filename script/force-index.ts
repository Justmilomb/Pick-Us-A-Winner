/**
 * Force IndexNow submission for all pages
 * Run this script to immediately notify search engines about all URLs
 */

const INDEXNOW_KEY = "2d3b9af4fb684c5cb646d6f9e42ffce8";
const BASE_URL = "https://pickusawinner.com";

// All URLs from the site
const ALL_URLS = [
  "/",
  "/giveaway-generator",
  "/tool",
  "/spin-the-wheel",
  "/random-name-picker",
  "/random-option-picker",
  "/how-it-works",
  "/instagram-giveaway-guide",
  "/wheel",
  "/picker",
  "/youtube",
  "/tiktok",
  "/facebook-picker",
  "/twitter-picker",
  "/press",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  // Article URLs
  "/article/best-instagram-comment-picker-tools-2026",
  "/article/how-to-pick-instagram-winner",
  "/article/what-is-random-name-picker",
  "/article/instagram-giveaway-rules-2026",
  "/article/free-giveaway-generator-tools-comparison",
  "/article/giveaway-fraud-detection-explained",
  "/article/fair-random-winner-selection",
  "/article/spin-wheel-vs-random-picker",
  // New pages
  "/sitemap",
];

async function submitToIndexNow() {
  const payload = {
    host: "pickusawinner.com",
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: ALL_URLS.map((u) => `${BASE_URL}${u}`),
  };

  const engines = [
    "https://api.indexnow.org/IndexNow", // Google + Bing
    "https://www.bing.com/IndexNow", // Bing direct
    "https://yandex.com/indexnow", // Yandex
  ];

  console.log(`Submitting ${ALL_URLS.length} URLs to IndexNow...`);

  for (const engine of engines) {
    try {
      const response = await fetch(engine, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ ${engine} - Status ${response.status} (Success)`);
      } else {
        const text = await response.text();
        console.log(`⚠️ ${engine} - Status ${response.status}: ${text}`);
      }
    } catch (error) {
      console.log(`❌ ${engine} - Failed: ${error}`);
    }
  }

  console.log("\n✅ IndexNow submission complete!");
  console.log(
    "\nNext steps:\n" +
      "1. Go to Google Search Console: https://search.google.com/search-console\n" +
      "2. Use URL Inspection tool for each URL\n" +
      "3. Click 'Request Indexing' for priority pages\n" +
      "4. Wait 24-48 hours for crawling\n"
  );
}

submitToIndexNow().catch(console.error);
