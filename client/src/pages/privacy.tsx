import Layout from "@/components/layout";
import { SEO } from "@/components/seo";

export default function PrivacyPolicy() {
    return (
        <Layout>
            <SEO
                title="Privacy Policy"
                description="PickUsAWinner Privacy Policy - Learn how we collect, use, and protect your data"
                url="/privacy"
            />
            <div className="max-w-4xl mx-auto space-y-12 py-12">
                <h1 className="text-5xl md:text-7xl font-black uppercase italic border-b-8 border-black pb-4">Privacy Policy</h1>

                <div className="prose prose-xl font-bold text-slate-800 space-y-8">
                    <section>
                        <h2 className="text-3xl font-black uppercase">1. Information We Collect</h2>
                        <p>We only collect the minimum amount of information necessary to run your giveaways: your email and account identifier. We do not store your social media passwords.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">2. How We Use Data</h2>
                        <p>Your email is used solely for authentication and to send you the results of your scheduled giveaways. We never sell your data to third parties.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">3. Local Persistence</h2>
                        <p>Account data is stored securely on our local servers to ensure you can access your history and scheduled tasks.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">4. Cookies</h2>
                        <p>We use essential cookies to keep you logged in. These are necessary for the core functionality of PickUsAWinner.</p>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
