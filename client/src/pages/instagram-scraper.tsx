import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { AdBanner } from "@/components/AdBanner";
import { Instagram, Search, ShieldCheck, Zap } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";

export default function InstagramScraperPage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is an Instagram Comment Scraper?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An Instagram comment scraper is a tool that allows you to extract comments from a public Instagram post. It's essential for running giveaways and analyzing engagement."
                }
            },
            {
                "@type": "Question",
                "name": "How do I export Instagram comments to Excel?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our tool automatically scrapes all comments and allows you to use them for winner selection or export them for further analysis."
                }
            }
        ]
    };

    return (
        <Layout>
            <SEO
                title="Instagram Comment Scraper | Export & Pick Winners"
                description="Extract and scrape comments from any Instagram post. The best free Instagram comment scraper for giveaways, data analysis, and export. 100% secure and fast."
                url="/instagram-comment-scraper"
                keywords="instagram comment scraper, export instagram comments, scrape instagram comments, instagram giveaway tool, comment picker"
                structuredData={faqStructuredData}
            />

            <div className="max-w-6xl mx-auto space-y-12 pb-20 pt-8">
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-instagram text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000]"
                    >
                        <Search className="w-5 h-5" /> Data Extraction Tool
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]">
                        Instagram <br className="hidden md:block" />
                        <span className="text-primary text-stroke-sm">Comment Scraper</span>
                    </h1>
                    <p className="text-xl font-bold text-muted-foreground max-w-2xl mx-auto px-4">
                        The most reliable way to extract comments from Instagram posts and Reels for giveaways and analysis.
                    </p>

                    <div className="pt-4">
                        <Link href="/tool" className="neo-btn-primary text-2xl py-6 px-12">
                            Try the Scraper Now
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 px-4">
                    <div className="neo-box p-8 bg-white space-y-4">
                        <div className="bg-yellow-400 p-3 border-2 border-black w-fit shadow-neo-sm">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black uppercase">Instant Export</h3>
                        <p className="font-bold text-muted-foreground">Scrape up to 200 comments instantly. Need more? Our pro scraper handles 10,000+ comments.</p>
                    </div>
                    <div className="neo-box p-8 bg-white space-y-4">
                        <div className="bg-primary p-3 border-2 border-black w-fit shadow-neo-sm text-white">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black uppercase">Anti-Fraud</h3>
                        <p className="font-bold text-muted-foreground">Automatically filter out spam, fake accounts, and duplicate entries to ensure a fair result.</p>
                    </div>
                    <div className="neo-box p-8 bg-white space-y-4">
                        <div className="bg-accent p-3 border-2 border-black w-fit shadow-neo-sm text-white">
                            <Instagram className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black uppercase">Post & Reels</h3>
                        <p className="font-bold text-muted-foreground">Works with standard photo posts, carousels, and even the latest viral Reels.</p>
                    </div>
                </div>

                <InstagramFunnel />

                <section className="px-4">
                    <AdBanner type="adsense" className="w-full" />
                </section>

                {/* Deep Dive Content */}
                <div className="bg-white border-y-4 border-black py-16 px-6">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <h2 className="text-4xl font-black uppercase">Why use an Instagram Scraper?</h2>
                        <div className="space-y-4 text-lg font-medium leading-relaxed">
                            <p>
                                In 2026, Instagram giveaways are more popular than ever. But as a creator, you face a huge challenge: <strong>how do you pick a winner fairly?</strong>
                                Manually selecting from thousands of comments is not only slow but also prone to bias and can lead to accusations of "rigging" the contest.
                            </p>
                            <p>
                                Our <strong>Instagram Comment Scraper</strong> solves this by using the official API and certified random algorithms.
                                We extract every comment on your post and let you apply rules like "must mention 2 friends" or "must include #giveaway".
                            </p>
                            <h3 className="text-2xl font-black uppercase mt-8">SEO Benefits for Creators</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Increase engagement by requiring specific keywords.</li>
                                <li>Analyze which fans are your most loyal (top commenters).</li>
                                <li>Export data to Excel/CSV for marketing purposes.</li>
                                <li>Show proof of randomness to your audience.</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
