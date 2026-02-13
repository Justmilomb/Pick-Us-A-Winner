import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { motion } from "framer-motion";
import { AdBanner } from "@/components/AdBanner";
import { Twitter, Sparkles } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";

export default function TwitterPage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How to pick a winner from Twitter replies?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Coming soon: PickUsAWinner for X (Twitter) will help you pick random winners from replies, retweets, and hashtags."
                }
            }
        ]
    };

    return (
        <Layout>
            <SEO
                title="Twitter (X) Comment Picker | Random Giveaway Winner Generator"
                description="The fastest Twitter giveaway tool. Randomly pick winners from X replies, retweets, and followers. Fair, open, and free for creators."
                url="/twitter-picker"
                keywords="twitter comment picker, x giveaway tool, twitter giveaway picker, random retweet picker, twitter winner generator"
                structuredData={faqStructuredData}
            />

            <div className="max-w-4xl mx-auto space-y-12 pb-12 pt-8 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 bg-black text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] mb-6"
                >
                    <Twitter className="w-5 h-5" /> Coming Soon
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none">
                    Twitter (X) <br />
                    <span className="text-white text-stroke-sm bg-black px-2">Giveaway Picker</span>
                </h1>

                <p className="text-xl font-bold text-muted-foreground max-w-2xl mx-auto px-4">
                    The ultimate verification tool for X contests. Pick winners from retweets, replies, and mentions instantly.
                </p>

                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-8 md:p-12 mx-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>

                    <h2 className="text-2xl font-black uppercase mb-4">Join the X-Waitlist</h2>
                    <p className="mb-6 font-medium">Be the first to use the fairest Twitter picker on the market.</p>

                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="neo-input flex-1 border-black"
                        />
                        <button className="neo-btn-primary bg-black text-white">
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
                    <h2 className="text-3xl font-black uppercase border-b-4 border-black pb-2 inline-block">Boost your X Engagement</h2>
                    <p className="text-lg leading-relaxed font-medium">
                        Twitter (X) is the home of the "Retweet to Win" culture. It's the fastest way to get your brand in front of millions of people.
                    </p>
                    <p className="text-lg leading-relaxed font-medium">
                        Our <strong>X Random Picker</strong> will verify retweets and replies to ensure only real fans win your prizes.
                    </p>
                </div>

            </div>
        </Layout>
    );
}
