import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo";

export default function ComingSoon() {
    return (
        <Layout>
            <SEO title="Coming Soon" description="YouTube and TikTok giveaway pickers coming soon" url="/coming-soon" />
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-12">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-primary text-white border-4 border-black p-8 shadow-neo-lg rotate-2"
                >
                    <Sparkles className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-5xl md:text-7xl font-black uppercase italic">Coming Soon</h1>
                </motion.div>

                <div className="max-w-2xl space-y-6">
                    <p className="text-2xl md:text-3xl font-bold text-slate-700">
                        We're working on YouTube & TikTok pickers right now.
                        They'll be here soon!
                    </p>

                    <Link href="/tool">
                        <Button className="neo-btn-primary text-xl py-8 px-10 gap-3">
                            <ArrowLeft className="w-6 h-6" /> Back to Instagram Picker
                        </Button>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
