import Layout from "@/components/layout";
import { SEO } from "@/components/seo";

export default function TermsOfService() {
    return (
        <Layout>
            <SEO
                title="Terms of Service"
                description="PickUsAWinner Terms of Service - Read our terms and conditions for using the giveaway picker tool"
                url="/terms"
            />
            <div className="max-w-4xl mx-auto space-y-12 py-12">
                <h1 className="text-5xl md:text-7xl font-black uppercase italic border-b-8 border-black pb-4">Terms of Service</h1>

                <div className="prose prose-xl font-bold text-slate-800 space-y-8">
                    <section>
                        <h2 className="text-3xl font-black uppercase">1. Acceptance of Terms</h2>
                        <p>By using PickUsAWinner, you agree to these terms. If you do not agree, please do not use the service.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">2. Fair Use</h2>
                        <p>Our tool is designed for fair winner selection. Any attempt to manipulate results or bypass our anti-cheat systems will result in account termination.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">3. Disclaimer</h2>
                        <p>PickUsAWinner is provided "as is". We are not responsible for any issues arising from the use of our automated picking systems or API limitations of third-party platforms like Instagram.</p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black uppercase">4. Modifications</h2>
                        <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
