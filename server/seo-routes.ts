export interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
}

const BASE = "https://pickusawinner.com";
const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

export const SEO_ROUTES: Record<string, RouteMeta> = {
  "/": {
    title: "Pick Us a Winner - Giveaway Generator & Random Picker",
    description:
      "Run fair Instagram giveaways and pick random winners instantly. Free spin the wheel, random name picker, and comment picker tools — no signup required.",
    canonical: `${BASE}/giveaway-generator`,
  },
  "/giveaway-generator": {
    title: "Instagram Giveaway Generator - Pick Winners from Comments | PickUsAWinner",
    description:
      "Pick random winners from Instagram comments in seconds. Filter by hashtag, mentions, and follower rules. Fair, transparent, one-time payment.",
    canonical: `${BASE}/giveaway-generator`,
  },
  "/tool": {
    title: "Giveaway Tool - Run Your Instagram Comment Picker | PickUsAWinner",
    description:
      "Use our giveaway tool to fetch Instagram comments, apply eligibility filters, and pick verified random winners for your contest.",
    canonical: `${BASE}/tool`,
  },
  "/spin-the-wheel": {
    title: "Spin the Wheel - Free Random Name Picker Wheel | PickUsAWinner",
    description:
      "Spin the wheel to pick a random winner or random choice. Add your own names or options, spin, and get a fair result instantly. 100% free.",
    canonical: `${BASE}/spin-the-wheel`,
  },
  "/random-name-picker": {
    title: "Random Name Picker - Pick a Random Name Online | PickUsAWinner",
    description:
      "Pick a random name from a list in one click. Perfect for giveaways, classroom activities, team selections, and any random draw. Free and instant.",
    canonical: `${BASE}/random-name-picker`,
  },
  "/random-option-picker": {
    title: "Random Option Picker - Choose a Random Option | PickUsAWinner",
    description:
      "Can't decide? Enter your options and let our random picker choose for you. Free, instant, and fair — no bias, no overthinking.",
    canonical: `${BASE}/random-option-picker`,
  },
  "/how-it-works": {
    title: "How It Works - PickUsAWinner Instagram Giveaway Guide",
    description:
      "Learn how PickUsAWinner picks winners from Instagram comments. Step-by-step walkthrough of comment fetching, filtering, and random selection.",
    canonical: `${BASE}/how-it-works`,
  },
  "/instagram-giveaway-guide": {
    title: "Instagram Giveaway Guide - How to Run a Successful Contest | PickUsAWinner",
    description:
      "Complete guide to running Instagram giveaways. Covers rules, hashtag strategy, comment picker tools, and how to announce winners fairly.",
    canonical: `${BASE}/instagram-giveaway-guide`,
  },
  "/wheel": {
    title: "Spin the Wheel - Free Random Name Picker Wheel | PickUsAWinner",
    description:
      "Spin the wheel to pick a random winner or random choice. Add your own names or options, spin, and get a fair result instantly. 100% free.",
    canonical: `${BASE}/spin-the-wheel`,
  },
  "/picker": {
    title: "Random Name Picker - Pick a Random Name Online | PickUsAWinner",
    description:
      "Pick a random name from a list in one click. Perfect for giveaways, classroom activities, team selections, and any random draw. Free and instant.",
    canonical: `${BASE}/random-name-picker`,
  },
  "/youtube": {
    title: "YouTube Comment Picker - Pick Random YouTube Winners | PickUsAWinner",
    description:
      "Pick a random winner from YouTube comments. Paste your video URL, fetch comments, filter entries, and select a fair random winner instantly.",
    canonical: `${BASE}/youtube`,
  },
  "/tiktok": {
    title: "TikTok Comment Picker - Pick Random TikTok Winners | PickUsAWinner",
    description:
      "Pick a random winner from TikTok comments. Fast, fair, and free TikTok giveaway picker — no software to install.",
    canonical: `${BASE}/tiktok`,
  },
  "/facebook-picker": {
    title: "Facebook Comment Picker - Pick Random Facebook Winners | PickUsAWinner",
    description:
      "Pick a random winner from Facebook comments or posts. Fair, transparent Facebook giveaway picker — results you can show your audience.",
    canonical: `${BASE}/facebook-picker`,
  },
  "/twitter-picker": {
    title: "Twitter/X Comment Picker - Pick Random Twitter Winners | PickUsAWinner",
    description:
      "Pick a random winner from Twitter or X replies and retweets. Fair Twitter giveaway picker for contests, sweepstakes, and promotions.",
    canonical: `${BASE}/twitter-picker`,
  },
  "/faq": {
    title: "FAQ - PickUsAWinner Giveaway Tool Questions Answered",
    description:
      "Answers to the most common questions about PickUsAWinner: how it works, pricing, Instagram scraping, winner verification, and more.",
    canonical: `${BASE}/faq`,
  },
  "/contact": {
    title: "Contact Us - PickUsAWinner Support",
    description:
      "Get in touch with the PickUsAWinner team for support, partnership inquiries, or general questions about our giveaway tools.",
    canonical: `${BASE}/contact`,
  },
  "/press": {
    title: "Press - PickUsAWinner Media Kit & Press Inquiries",
    description:
      "Press information, media kit, and brand assets for PickUsAWinner. Contact us for media or partnership opportunities.",
    canonical: `${BASE}/press`,
  },
  "/privacy": {
    title: "Privacy Policy - PickUsAWinner",
    description:
      "Read PickUsAWinner's privacy policy to understand how we collect, use, and protect your data when you use our giveaway tools.",
    canonical: `${BASE}/privacy`,
    robots: DEFAULT_ROBOTS,
  },
  "/terms": {
    title: "Terms of Service - PickUsAWinner",
    description:
      "Review the terms of service for PickUsAWinner. By using our tools, you agree to these terms governing usage, payments, and conduct.",
    canonical: `${BASE}/terms`,
    robots: DEFAULT_ROBOTS,
  },
  "/analytics": {
    title: "Analytics - PickUsAWinner",
    description: "Internal analytics dashboard.",
    canonical: `${BASE}/analytics`,
    robots: "noindex, nofollow",
  },
  "/login": {
    title: "Log In - PickUsAWinner",
    description: "Log in to your PickUsAWinner account to manage scheduled giveaways and view results.",
    canonical: `${BASE}/login`,
    robots: "noindex, nofollow",
  },
  "/register": {
    title: "Create Account - PickUsAWinner",
    description: "Create a PickUsAWinner account to schedule giveaways and access your results history.",
    canonical: `${BASE}/register`,
    robots: "noindex, nofollow",
  },
};

export function getRouteMeta(urlPath: string): RouteMeta | null {
  // Strip query string
  const cleanPath = urlPath.split("?")[0];

  // Exact match
  if (SEO_ROUTES[cleanPath]) return SEO_ROUTES[cleanPath];

  // /schedule/:token — public giveaway result pages, no-index (token-specific)
  if (cleanPath.startsWith("/schedule/")) {
    return {
      title: "Giveaway Results - PickUsAWinner",
      description:
        "View the official giveaway results and winner announcement for this contest, powered by PickUsAWinner.",
      canonical: `${BASE}${cleanPath}`,
      robots: "noindex, follow",
    };
  }

  // /article/:slug — handled by React Helmet; return null so raw index.html is served
  return null;
}
