import Layout from "@/components/layout";
import { SEO } from "@/components/seo";

export default function TermsOfService() {
    return (
        <Layout>
            <SEO
                title="Terms of Service"
                description="PickUsAWinner Terms of Service - Rules for using our giveaway picker, credit system, and payment terms"
                url="/terms"
                noindex
            />
            <div className="max-w-4xl mx-auto space-y-12 py-12">
                <h1 className="text-5xl md:text-7xl font-black uppercase italic border-b-8 border-black pb-4">Terms of Service</h1>
                <p className="text-lg font-bold text-muted-foreground">Last updated: February 2026</p>

                <div className="prose prose-xl font-bold text-slate-800 space-y-8">

                    <section>
                        <h2 className="text-3xl font-black uppercase">1. Acceptance of Terms</h2>
                        <p>By accessing or using PickUsAWinner ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">2. Description of Service</h2>
                        <p>PickUsAWinner provides online tools for random selection, including:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Instagram Comment Picker</strong> — fetches publicly available comments from an Instagram post URL you provide and randomly selects winners based on your filter criteria.</li>
                            <li><strong>Spin the Wheel</strong> — a browser-based random wheel spinner.</li>
                            <li><strong>Random Name Picker</strong> — picks random names from a list you enter.</li>
                            <li><strong>Scheduled Giveaways</strong> — allows you to schedule a giveaway to run automatically at a future date.</li>
                        </ul>
                        <p>The Spin the Wheel and Random Name Picker tools run entirely in your browser. The Instagram Comment Picker requires server-side processing to fetch comments.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">3. Credits & Payment</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Each user (identified by IP address) receives <strong>2 free credits</strong> for fetching Instagram comments.</li>
                            <li>Additional credits can be purchased via a <strong>one-time payment</strong> through Stripe. There are no subscriptions, no recurring charges, and no hidden fees.</li>
                            <li>Credits are non-refundable once redeemed.</li>
                            <li>Each credit allows you to fetch comments from one Instagram post. The number of comments fetched depends on the post and Instagram's availability.</li>
                            <li>We reserve the right to adjust pricing and credit amounts at any time. Existing purchased credits will not be affected.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">4. Fair Use & Anti-Abuse</h2>
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Attempt to manipulate or rig giveaway results.</li>
                            <li>Circumvent the credit system, rate limits, or IP-based restrictions.</li>
                            <li>Use automated scripts, bots, or tools to abuse the Service.</li>
                            <li>Scrape or harvest data from our website beyond normal use.</li>
                            <li>Use the Service for any illegal purpose or to violate third-party platform terms (including Instagram's Terms of Use).</li>
                        </ul>
                        <p>We implement rate limiting, IP blocking, and fraud detection. Abuse of the Service may result in your IP being blocked without notice.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">5. Instagram & Third-Party Platforms</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>PickUsAWinner is <strong>not affiliated with, endorsed by, or sponsored by Instagram, Meta, YouTube, TikTok, or any other social media platform</strong>.</li>
                            <li>We access only publicly available comment data from Instagram posts. We do not require your Instagram login or password.</li>
                            <li>Instagram may change its APIs or block access at any time. We cannot guarantee uninterrupted access to Instagram comments. If a fetch fails due to Instagram restrictions, your credit will not be consumed.</li>
                            <li>You are responsible for ensuring your giveaway complies with Instagram's Promotion Guidelines and any applicable laws in your jurisdiction.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">6. Randomness & Fairness</h2>
                        <p>Our random selection uses the <strong>Web Crypto API</strong> (<code className="bg-slate-100 px-1 border border-black text-sm">crypto.getRandomValues()</code>) combined with the <strong>Fisher-Yates shuffle algorithm</strong>. This provides cryptographically secure randomness — the same standard used in encryption.</p>
                        <p>While we take every reasonable measure to ensure fairness, we do not guarantee specific outcomes. The selection is random, and by definition, results are unpredictable.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">7. Scheduled Giveaways</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Scheduled giveaways run automatically at the time you specify. Results are sent to the email address you provide.</li>
                            <li>We make best efforts to run scheduled giveaways on time, but cannot guarantee exact timing due to server load or third-party API availability.</li>
                            <li>If a scheduled giveaway fails (e.g., Instagram is unavailable), it will be marked as failed and no winners will be selected.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">8. Intellectual Property</h2>
                        <p>All content on PickUsAWinner — including the design, code, brand name, logo, and documentation — is owned by PickUsAWinner and protected by applicable intellectual property laws.</p>
                        <p>You may not copy, reproduce, or redistribute any part of the Service without our written permission.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">9. Disclaimer of Warranties</h2>
                        <p>The Service is provided <strong>"as is" and "as available"</strong> without warranties of any kind, whether express or implied, including but not limited to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Fitness for a particular purpose.</li>
                            <li>Uninterrupted or error-free operation.</li>
                            <li>Accuracy or completeness of Instagram data fetched.</li>
                            <li>Compatibility with Instagram's terms or API changes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">10. Limitation of Liability</h2>
                        <p>To the maximum extent permitted by law, PickUsAWinner shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Loss of profits, data, or business opportunities.</li>
                            <li>Failed or incorrect giveaway results.</li>
                            <li>Disputes between giveaway hosts and participants.</li>
                            <li>Actions taken by Instagram or other third parties that affect the Service.</li>
                        </ul>
                        <p>Our total liability to you for any claim shall not exceed the amount you paid to us in the 12 months preceding the claim.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">11. Termination</h2>
                        <p>We may suspend or block access to the Service at any time, without notice, for any reason — including suspected abuse, violation of these terms, or technical issues. Since the Service does not require an account, "termination" means blocking your IP from accessing the Service.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">12. Changes to Terms</h2>
                        <p>We may modify these Terms of Service at any time. Changes take effect when posted. The "Last updated" date at the top reflects the most recent revision. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">13. Governing Law</h2>
                        <p>These terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these terms or your use of the Service shall be resolved in the courts of the jurisdiction in which PickUsAWinner operates.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">14. Contact</h2>
                        <p>Questions about these Terms? Reach out via our <a href="/contact" className="text-primary hover:underline">Contact page</a>.</p>
                    </section>

                </div>
            </div>
        </Layout>
    );
}
