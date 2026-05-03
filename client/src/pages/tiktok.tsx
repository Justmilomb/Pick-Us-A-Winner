import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Sparkles, ArrowRight } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";
import { RelatedTools } from "@/components/RelatedTools";

export default function TikTokPage() {
    return (
        <Layout>
            <SEO
                title="TikTok Giveaway Picker | Pick Us A Winner"
                description="Pick Us A Winner focused on Instagram — the platform creators use most for giveaways. For TikTok contests, use our free Name Picker or Spin the Wheel."
                url="/tiktok"
                keywords="tiktok comment picker, tiktok giveaway tool, random comment picker tiktok, tiktok contest winner, social media giveaway tools"
            />

            <div className="max-w-4xl mx-auto space-y-12 pb-12 pt-8 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 bg-black text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#00feff] -rotate-1 mb-6"
                >
                    <Sparkles className="w-5 h-5 text-[#ff0050]" /> TikTok Picker
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none">
                    TikTok <br />
                    <span className="text-strokes-double text-black">Giveaway Picker</span>
                </h1>

                <p className="text-xl font-bold text-muted-foreground max-w-2xl mx-auto px-4">
                    Pick Us A Winner focused on Instagram — the platform creators use most for giveaways.
                    For TikTok contests, copy commenter names and use the free Name Picker or Spin the Wheel below.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/random-name-picker" className="neo-btn-primary flex items-center justify-center gap-2">
                        Use Name Picker <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/spin-the-wheel" className="neo-btn-secondary flex items-center justify-center gap-2">
                        Spin the Wheel
                    </Link>
                </div>

                <InstagramFunnel />

                <div className="text-left max-w-3xl mx-auto px-6 space-y-6">
                    <h2 className="text-3xl font-black uppercase border-b-4 border-black pb-2 inline-block">Picking TikTok Giveaway Winners</h2>
                    <p className="text-lg leading-relaxed font-medium">
                        Giveaways are one of the best ways to grow on TikTok. To pick a winner from your comments,
                        copy the commenter names and paste them into our{" "}
                        <Link href="/random-name-picker" className="text-primary font-bold underline hover:no-underline">Random Name Picker</Link> or{" "}
                        <Link href="/spin-the-wheel" className="text-primary font-bold underline hover:no-underline">Spin the Wheel</Link> — both run entirely in your browser.
                        For Instagram giveaways, use the{" "}
                        <Link href="/tool" className="text-primary font-bold underline hover:no-underline">Instagram Giveaway Picker</Link>.
                    </p>
                    <RelatedTools excludePath="/tiktok" max={3} className="mt-12 pt-8 border-t-2 border-black" />
                </div>
            </div>
        </Layout>
    );
}
