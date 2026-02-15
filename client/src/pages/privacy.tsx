import Layout from "@/components/layout";
import { SEO } from "@/components/seo";

export default function PrivacyPolicy() {
    return (
        <Layout>
            <SEO
                title="Privacy Policy"
                description="PickUsAWinner Privacy Policy - How we handle your data, cookies, and third-party services"
                url="/privacy"
                noindex
            />
            <div className="max-w-4xl mx-auto space-y-12 py-12">
                <h1 className="text-5xl md:text-7xl font-black uppercase italic border-b-8 border-black pb-4">Privacy Policy</h1>
                <p className="text-lg font-bold text-muted-foreground">Last updated: February 2026</p>

                <div className="prose prose-xl font-bold text-slate-800 space-y-8">

                    <section>
                        <h2 className="text-3xl font-black uppercase">1. What We Collect</h2>
                        <p>PickUsAWinner collects as little data as possible. Here is exactly what we collect and why:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>IP address</strong> — used for abuse prevention, rate limiting, and operational security. We do not link your IP to any personal identity.</li>
                            <li><strong>Instagram comments</strong> — when you fetch comments from an Instagram post, we temporarily process usernames, comment text, and timestamps in memory to filter and pick winners. This data is <strong>not stored</strong> on our servers after your session ends.</li>
                            <li><strong>Payment information</strong> — processed entirely by Stripe. We never see or store your card number, CVV, or billing details. We only receive a confirmation that your payment succeeded and a transaction ID to prevent double-redemption.</li>
                            <li><strong>Cookies</strong> — we use essential cookies for session management and a cookie consent preference. See Section 5 below.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">2. Tools That Run Locally</h2>
                        <p>Our <strong>Spin the Wheel</strong>, <strong>Random Name Picker</strong>, and <strong>Random Option Picker</strong> tools run entirely in your browser. No data from these tools is sent to our servers. Your entries, names, and options stay on your device and are never stored or transmitted.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">3. Instagram Data</h2>
                        <p>When you use the Instagram Comment Picker:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>We fetch publicly available comments from the Instagram post URL you provide.</li>
                            <li>Comments are processed in memory to apply your filters (keywords, mentions, duplicates) and select winners.</li>
                            <li>We do <strong>not</strong> store Instagram usernames, comments, or any scraped data after your session.</li>
                            <li>We do <strong>not</strong> access your Instagram account. We only read public comments from the post URL you provide.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">4. Payments</h2>
                        <p>PickUsAWinner uses one-time payments for paid giveaway actions:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>A <strong>one-time payment</strong> is required each time you run winner selection or schedule a giveaway.</li>
                            <li>There are no subscriptions or recurring charges.</li>
                            <li>Payment processing is handled entirely by <strong>Stripe</strong>. Your card details go directly to Stripe's servers — we never see them. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe's Privacy Policy</a>.</li>
                            <li>We store payment verification tokens (not card details) to validate paid actions and prevent abuse.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">5. Cookies & Advertising</h2>
                        <p>We use the following types of cookies:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Essential cookies</strong> — session cookies to maintain your logged-in state and CSRF protection. These are required for the site to function.</li>
                            <li><strong>Consent cookie</strong> — stores your Accept/Reject choice for advertising cookies so we don't ask you again.</li>
                            <li><strong>Advertising cookies (optional)</strong> — if you accept cookies in our consent banner, Google AdSense may set cookies to show you relevant ads. These are governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Privacy Policy</a>.</li>
                        </ul>
                        <p>We implement <strong>Google Consent Mode v2</strong>. By default, all advertising cookies are <strong>denied</strong> until you explicitly accept them via our cookie consent banner. If you reject cookies, no advertising data is collected.</p>
                        <p>You can change your cookie preference at any time by clearing your browser's local storage for this site.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">6. Third-Party Services</h2>
                        <p>We use the following third-party services:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Stripe</strong> — payment processing. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
                            <li><strong>Google AdSense</strong> — advertising (only with your consent). <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
                            <li><strong>Trustpilot</strong> — review widget. <a href="https://legal.trustpilot.com/for-reviewers/end-user-privacy-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
                            <li><strong>Google Fonts</strong> — font delivery. No cookies are set; fonts are loaded via CSS.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">7. Data Retention</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Instagram comment data: <strong>not retained</strong> — processed in memory only.</li>
                            <li>Rate-limit and abuse-prevention records (IP-based): retained as long as the service is running.</li>
                            <li>Payment tokens: retained to prevent double-redemption.</li>
                            <li>Cookie consent preference: stored in your browser's local storage indefinitely (you can clear it anytime).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">8. Your Rights (GDPR / CCPA)</h2>
                        <p>If you are in the EU, UK, or California, you have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Access</strong> any personal data we hold about you.</li>
                            <li><strong>Delete</strong> your data — since we don't store personal data beyond your session, there is typically nothing to delete.</li>
                            <li><strong>Opt out</strong> of advertising cookies via our consent banner.</li>
                            <li><strong>Object</strong> to data processing — contact us and we will address your concern.</li>
                        </ul>
                        <p>To exercise any of these rights, contact us at the email below.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">9. Children's Privacy</h2>
                        <p>PickUsAWinner is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has provided us data, please contact us and we will delete it.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">10. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy from time to time. Changes will be reflected by updating the "Last updated" date at the top. Continued use of the site after changes constitutes acceptance.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">11. Contact</h2>
                        <p>If you have questions about this Privacy Policy, reach out via our <a href="/contact" className="text-primary hover:underline">Contact page</a>.</p>
                    </section>

                </div>
            </div>
        </Layout>
    );
}

