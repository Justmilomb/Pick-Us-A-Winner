import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";
import { RelatedTools } from "@/components/RelatedTools";

export default function TikTokPage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Can I pick a winner from TikTok comments?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Coming soon: We are building a tool to fetch comments from your TikTok videos and randomly select winners for your giveaways."
                }
            }
        ]
    };

    return (
        <Layout>
            <SEO
                title="TikTok Comment Picker | Random Giveaway Winner Generator"
                description="Free TikTok comment picker. No signup, no login. Randomly select winners for TikTok giveaways and contests. Fair, fast, instant."
                url="/tiktok"
                keywords="tiktok comment picker, tiktok giveaway tool, random comment picker tiktok, tiktok contest winner, social media giveaway tools"
                structuredData={faqStructuredData}
            />

            <div className="max-w-4xl mx-auto space-y-12 pb-12 pt-8 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 bg-black text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#00feff] -rotate-1 mb-6"
                >
                    <Sparkles className="w-5 h-5 text-[#ff0050]" /> Coming Soon
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none">
                    TikTok <br />
                    <span className="text-strokes-double text-black">Giveaway Picker</span>
                </h1>

                <p className="text-xl font-bold text-muted-foreground max-w-2xl mx-auto px-4">
                    Go viral with your next giveaway. The most advanced comment picker for TikTok creators is coming.
                </p>

                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#ff0050] p-8 md:p-12 mx-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00feff] to-[#ff0050]"></div>

                    <h2 className="text-2xl font-black uppercase mb-4">Get Early Access</h2>
                    <p className="mb-6 font-medium">Be the first to know when our TikTok tool launches.</p>

                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="neo-input flex-1 border-black focus:shadow-[2px_2px_0px_0px_#00feff]"
                        />
                        <button className="neo-btn-primary bg-black text-white hover:bg-slate-900 shadow-[4px_4px_0px_0px_#00feff]">
                            Join List
                        </button>
                    </form>
                </div>

                <InstagramFunnel />

                {/* SEO Text Content */}
                <div className="text-left max-w-3xl mx-auto px-6 space-y-6">
                    <h2 className="text-3xl font-black uppercase border-b-4 border-black pb-2 inline-block">Boost your TikTok Engagement</h2>
                    <p className="text-lg leading-relaxed font-medium">
                        Giveaways are the secret weapon for TikTok growth. Asking users to "Tag a friend" or "Comment to win" drives massive engagement signals to the algorithm.
                        Need a picker now? Try our <Link href="/tool" className="text-primary font-bold underline hover:no-underline">Instagram Picker</Link> for Instagram giveaways.
                    </p>
                    <p className="text-lg leading-relaxed font-medium">
                        Our <strong>TikTok Random Comment Picker</strong> will ensure your contests are fair and transparent, building trust with your audience.
                    </p>
                    <RelatedTools excludePath="/tiktok" max={3} className="mt-12 pt-8 border-t-2 border-black" />
                </div>

            </div>
        </Layout>
    );
}
