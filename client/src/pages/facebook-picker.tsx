import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { motion } from "framer-motion";
import { AdBanner } from "@/components/AdBanner";
import { Facebook, Sparkles } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";

export default function FacebookPage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How to pick a winner from Facebook comments?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Coming soon: PickUsAWinner will allow you to import comments from your Facebook posts and randomly select winners for your giveaways."
                }
            }
        ]
    };

    return (
        <Layout>
            <SEO
                title="Facebook Comment Picker | Random Giveaway Winner Generator"
                description="The best free Facebook comment picker for giveaways and contests. Randomly select winners from Facebook post comments fairly and instantly."
                url="/facebook-picker"
                keywords="facebook comment picker, facebook giveaway tool, random comment picker facebook, facebook contest winner"
                structuredData={faqStructuredData}
            />

            <div className="max-w-4xl mx-auto space-y-12 pb-12 pt-8 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 bg-[#1877F2] text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] mb-6"
                >
                    <Facebook className="w-5 h-5" /> Coming Soon
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none">
                    Facebook <br />
                    <span className="text-stroke-sm text-[#1877F2]">Giveaway Picker</span>
                </h1>

                <p className="text-xl font-bold text-muted-foreground max-w-2xl mx-auto px-4">
                    Professional tools for Facebook page managers and creators. The fairest way to run Facebook giveaways.
                </p>

                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#1877F2] p-8 md:p-12 mx-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-[#1877F2]"></div>

                    <h2 className="text-2xl font-black uppercase mb-4">Subscribe for Updates</h2>
                    <p className="mb-6 font-medium">Get notified when we release the Facebook Picker.</p>

                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="neo-input flex-1 border-black"
                        />
                        <button className="neo-btn-primary bg-[#1877F2] text-white shadow-[4px_4px_0px_0px_#000]">
                            Notify Me
                        </button>
                    </form>
                </div>

                <InstagramFunnel />

                <section className="container mx-auto px-4">
                    <AdBanner type="adsense" className="w-full" />
                </section>

                {/* SEO Text Content */}
                <div className="text-left max-w-3xl mx-auto px-6 space-y-6">
                    <h2 className="text-3xl font-black uppercase border-b-4 border-black pb-2 inline-block">Facebook Contest Management</h2>
                    <p className="text-lg leading-relaxed font-medium">
                        Facebook remains a powerhouse for brand loyalty. A well-run contest can reach thousands of potential customers.
                    </p>
                    <p className="text-lg leading-relaxed font-medium">
                        Our upcoming <strong>Facebook Random Comment Picker</strong> will integrate directly with your Page posts to pull verified comments and select winners based on your specific rules.
                    </p>
                </div>

            </div>
        </Layout>
    );
}
