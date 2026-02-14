import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Youtube, Sparkles } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";
import { RelatedTools } from "@/components/RelatedTools";

export default function YouTubePage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How to pick a winner from YouTube comments?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Coming soon: PickUsAWinner will allow you to instantly fetch comments from any YouTube video and select a random winner fairly."
                }
            },
            {
                "@type": "Question",
                "name": "Is the YouTube comment picker free?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our YouTube tool will be 100% free for content creators."
                }
            }
        ]
    };

    return (
        <Layout>
            <SEO
                title="YouTube Comment Picker | Random Giveaway Winner Generator"
                description="Pick a random winner from YouTube comments. No signup, no login. Free tool for YouTube giveaways and contests. Fair, transparent, instant."
                url="/youtube"
                keywords="youtube comment picker, random comment picker youtube, youtube giveaway tool, youtube winner generator, content creator tools"
                structuredData={faqStructuredData}
            />

            <div className="max-w-4xl mx-auto space-y-12 pb-12 pt-8 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 bg-red-600 text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] rotate-2 mb-6"
                >
                    <Youtube className="w-5 h-5" /> Coming Soon
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none">
                    YouTube <br />
                    <span className="text-stroke-sm text-red-600">Giveaway Picker</span>
                </h1>

                <p className="text-xl font-bold text-muted-foreground max-w-2xl mx-auto px-4">
                    We're building the ultimate tool for YouTubers. Pick winners from comments, filter by subscribers, and run multi-platform giveaways.
                </p>

                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 mx-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
                    <Sparkles className="w-12 h-12 text-yellow-400 absolute top-4 right-4 animate-spin-slow" />

                    <h2 className="text-2xl font-black uppercase mb-4">Join the Waitlist</h2>
                    <p className="mb-6 font-medium">Get early access when we launch. No spam, just updates.</p>

                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="neo-input flex-1"
                        />
                        <button className="neo-btn-primary bg-black text-white hover:bg-slate-800">
                            Notify Me
                        </button>
                    </form>
                </div>

                <InstagramFunnel />

                {/* SEO Text Content */}
                <div className="text-left max-w-3xl mx-auto px-6 space-y-6">
                    <h2 className="text-3xl font-black uppercase border-b-4 border-black pb-2 inline-block">Why use a YouTube Picker?</h2>
                    <p className="text-lg leading-relaxed font-medium">
                        Running a giveaway on YouTube is one of the best ways to grow your channel ("Subscribe to win!").
                        However, manually scrolling through thousands of comments to find a winner is impossible.
                        In the meantime, use our <Link href="/tool" className="text-primary font-bold underline hover:no-underline">Instagram Giveaway Picker</Link> for Instagram contests.
                    </p>

                    <div className="space-y-4 pt-4">
                        <h3 className="text-xl font-black uppercase">How it will work:</h3>
                        <ul className="list-disc pl-5 space-y-2 text-lg font-medium">
                            <li>Paste your YouTube Video URL</li>
                            <li>Filter by keyword or subscribers</li>
                            <li>Pick a random winner instantly</li>
                        </ul>
                    </div>
                    <RelatedTools excludePath="/youtube" max={3} className="mt-12 pt-8 border-t-2 border-black" />
                </div>

            </div>
        </Layout>
    );
}
