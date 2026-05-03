import Layout from "@/components/layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/seo";

export default function ComingSoon() {
  return (
    <Layout>
      <SEO title="Service Retired | Pick Us A Winner" description="Pick Us A Winner has been retired. The interface is preserved as a portfolio piece." url="/coming-soon" />
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="border-4 border-black p-8 shadow-neo bg-white max-w-xl"
        >
          <div className="inline-block bg-black text-white font-black px-4 py-1 text-xs uppercase tracking-widest mb-6">
            Service Retired
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic mb-4">
            Pick Us A <span className="text-primary">Winner</span>
          </h1>
          <p className="text-lg font-bold text-slate-700 mb-6 leading-relaxed">
            The Instagram giveaway picker was a live service built for creators.
            The backend has been retired — the client no longer needs it.
            The interface is preserved here as a portfolio piece.
          </p>
          <Link href="/giveaway-generator">
            <span className="neo-btn-secondary inline-flex items-center gap-2 cursor-pointer">
              <ArrowLeft className="w-5 h-5" /> Back to Portfolio Page
            </span>
          </Link>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/spin-the-wheel" className="neo-btn-primary">Spin the Wheel</Link>
          <Link href="/random-name-picker" className="neo-btn-secondary">Name Picker</Link>
          <Link href="/tool" className="neo-btn-secondary">Explore the Tool</Link>
        </div>
      </div>
    </Layout>
  );
}
