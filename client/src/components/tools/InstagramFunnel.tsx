import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Instagram, Sparkles } from "lucide-react";

export function InstagramFunnel() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-primary text-white p-6 sm:p-10 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-6 my-12 mx-4"
        >
            <div className="inline-flex items-center gap-2 bg-white text-black border-2 border-black px-3 py-1 font-black uppercase text-sm tracking-widest mb-2">
                <Sparkles className="w-4 h-4" /> Live Now
            </div>

            <h2 className="text-3xl md:text-5xl font-black uppercase italic leading-none">
                Need a Winner <span className="text-yellow-300">Right Now?</span>
            </h2>

            <p className="text-lg md:text-xl font-bold opacity-90 max-w-2xl mx-auto">
                While we're building our other tools, our <strong>Instagram Giveaway Generator</strong> is 100% functional and ready for your next contest!
            </p>

            <div className="pt-4">
                <Link
                    href="/tool"
                    className="bg-white text-black border-4 border-black p-4 sm:p-6 text-xl sm:text-3xl font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] transition-all inline-flex items-center gap-3 italic"
                >
                    <Instagram className="w-6 h-6 sm:w-8 sm:h-8" />
                    Go to Instagram Picker
                    <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </Link>
            </div>

            <p className="text-sm font-black uppercase tracking-tighter opacity-80 pt-2 text-yellow-300">
                Used by 10,000+ creators monthly
            </p>
        </motion.div>
    );
}
