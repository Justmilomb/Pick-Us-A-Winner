
const RAPIDAPI_HOST = "instagram-scraper-stable-api.p.rapidapi.com";
const RAPIDAPI_KEY = "1de957f3b2msh39e134d76b2c6f2p184f17jsnb0aaf569f9b2";

async function test(name, params, method = "POST", endpoint = "/get_ig_user_followers_v2.php", contentType = "application/x-www-form-urlencoded") {
    console.log(`\n--- Testing ${name} ---`);
    try {
        let url = `https://${RAPIDAPI_HOST}${endpoint}`;
        let body = undefined;
        let headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
        };

        if (method === "POST") {
            headers["Content-Type"] = contentType;
            if (contentType === "application/json") {
                body = JSON.stringify(params);
            } else {
                const searchParams = new URLSearchParams();
                for (const [key, value] of Object.entries(params)) {
                    searchParams.append(key, value);
                }
                body = searchParams.toString();
            }
        } else {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                searchParams.append(key, value);
            }
            url += "?" + searchParams.toString();
        }

        console.log(`Method: ${method}, URL: ${url}`);
        if (body) console.log(`Body: ${body}`);

        const response = await fetch(url, { method, headers, body });
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Preview:", text.substring(0, 500));
    } catch (e) {
        console.error("Failed:", e);
    }
}

async function run() {
    await test("POST id", { id: "25025320" });
    await test("POST user", { user: "instagram" });
    await test("POST JSON username", { username: "instagram" }, "POST", "/get_ig_user_followers_v2.php", "application/json");
    // Test Comments endpoint (expecting 400 or generic error if code invalid, but checking if it accepts param)
    await test("POST Comments code", { code: "DB1234567" }, "POST", "/get_ig_post_comments_v2.php");
}

run();
