
import fs from "fs";
import path from "path";

// Simple .env parser
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

async function testFollowers(userIdOrName: string) {
    const scenarios = [
        {
            name: "V2 POST Form user_id",
            url: `https://${RAPIDAPI_HOST}/get_ig_user_followers_v2.php`,
            method: "POST",
            body: new URLSearchParams({ user_id: userIdOrName }).toString(),
            headers: { 'content-type': 'application/x-www-form-urlencoded' }
        },
        {
            name: "V2 POST Form username",
            url: `https://${RAPIDAPI_HOST}/get_ig_user_followers_v2.php`,
            method: "POST",
            body: new URLSearchParams({ username: userIdOrName }).toString(),
            headers: { 'content-type': 'application/x-www-form-urlencoded' }
        },
        {
            name: "V2 GET Query user_id",
            url: `https://${RAPIDAPI_HOST}/get_ig_user_followers_v2.php?user_id=${userIdOrName}`,
            method: "GET",
        },
        {
            name: "V2 POST Query username (weird)",
            url: `https://${RAPIDAPI_HOST}/get_ig_user_followers_v2.php?username=${userIdOrName}`,
            method: "POST",
        },
        {
            name: "V1 POST Form user_id",
            url: `https://${RAPIDAPI_HOST}/get_ig_user_followers.php`,
            method: "POST",
            body: new URLSearchParams({ user_id: userIdOrName }).toString(),
            headers: { 'content-type': 'application/x-www-form-urlencoded' }
        },
        {
            name: "V1 POST Form username",
            url: `https://${RAPIDAPI_HOST}/get_ig_user_followers.php`,
            method: "POST",
            body: new URLSearchParams({ username: userIdOrName }).toString(),
            headers: { 'content-type': 'application/x-www-form-urlencoded' }
        },
    ];

    for (const s of scenarios) {
        console.log(`Testing ${s.name}...`);
        try {
            const h = {
                'x-rapidapi-key': RAPIDAPI_KEY!,
                'x-rapidapi-host': RAPIDAPI_HOST,
                ...s.headers
            };

            const response = await fetch(s.url, {
                method: s.method,
                headers: h as any,
                body: s.body
            });
            const text = await response.text();
            console.log(`${s.name} Result:`, text.slice(0, 150));
        } catch (error) {
            console.error(`${s.name} Error:`, error);
        }
    }
}

async function main() {
    if (!RAPIDAPI_KEY) {
        console.error("RAPIDAPI_KEY not found in env");
        process.exit(1);
    }

    // We try with "instagram" (username) and "25025320" (user_id)
    console.log("--- Testing with USERNAME 'instagram' ---");
    await testFollowers("instagram");

    console.log("\n--- Testing with ID '25025320' ---");
    await testFollowers("25025320");
}

main();
