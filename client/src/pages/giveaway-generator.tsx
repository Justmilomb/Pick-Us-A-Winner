import Layout from "@/components/layout";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { ArrowRight, Instagram, Sparkles, Shield, Zap, Clock, RotateCcw, Users, Dice5 } from "lucide-react";

export default function GiveawayGenerator() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Pick Us A Winner — Instagram Giveaway Generator",
    "description": "A full-stack Instagram giveaway tool built for creators. Scraped comments without API keys, filtered bots and duplicates, and picked cryptographically random winners.",
    "url": "https://pickusawinner.com/giveaway-generator",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web Browser",
    "author": { "@type": "Organization", "name": "Certified Random" },
  };

  const features = [
    {
      icon: <Instagram className="w-8 h-8" />,
      title: "Instagram Comment Scraping",
      desc: "Puppeteer-based scraper intercepted Instagram's internal endpoints — no API keys required. Handled full pagination across thousands of comments per post, with stealth plugins to avoid bot detection.",
      color: "bg-[#E1306C]",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Anti-Fraud Detection",
      desc: "Every comment received a fraud score based on bot signals: duplicate users weighted heavily, suspiciously short entries, emoji-only comments. Bad entries were filtered before the draw.",
      color: "bg-[#833AB4]",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Scheduled Giveaways",
      desc: "Run a giveaway at a future date and time. A background worker processed jobs on a 60-second poll cycle, with exponential back-off retry. Results were emailed automatically on completion.",
      color: "bg-[#405DE6]",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Cryptographic Randomness",
      desc: "Fisher-Yates shuffle seeded by the Web Crypto API. Every pick was verifiably fair — no Math.random(). Bonus-chance weighting rewarded creators who required multiple friend tags.",
      color: "bg-[#FCAF45]",
    },
  ];

  const freeTools = [
    {
      name: "Spin the Wheel",
      desc: "Add entries and spin. SVG wheel, crypto-seeded, up to 50 entries. Fully client-side.",
      link: "/spin-the-wheel",
      color: "bg-[#833AB4]",
      icon: <RotateCcw className="w-6 h-6" />,
    },
    {
      name: "Random Name Picker",
      desc: "Paste names, pick multiple winners. Fisher-Yates with Web Crypto. Nothing leaves your browser.",
      link: "/random-name-picker",
      color: "bg-[#FCAF45]",
      icon: <Users className="w-6 h-6" />,
    },
    {
      name: "Random Option Picker",
      desc: "Up to 30 options, rapid highlight animation, cryptographic pick. Can't decide? Let it choose.",
      link: "/random-option-picker",
      color: "bg-[#405DE6]",
      icon: <Dice5 className="w-6 h-6" />,
    },
  ];

  return (
    <Layout>
      <SEO
        title="Pick Us A Winner — Instagram Giveaway Generator | Built by Certified Random"
        description="Pick Us A Winner was a full-stack Instagram giveaway tool. Scraped comments without API keys, detected bots, and picked cryptographically random winners. Built by Certified Random."
        keywords="instagram giveaway generator, instagram comment picker, giveaway tool, certified random, portfolio, comment scraper, random winner selector"
        url="/giveaway-generator"
        structuredData={structuredData}
      />
      <div className="space-y-20">

        {/* Hero */}
        <div className="text-center space-y-8 pt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 bg-black text-white font-black px-6 py-2 border-4 border-black shadow-neo uppercase tracking-widest transform -rotate-1 text-sm"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block flex-shrink-0" />
            Shipped&nbsp;·&nbsp;Backend Retired
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">
            The Giveaway<br />
            <span className="text-primary">Generator</span><br />
            for Creators
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Pick Us A Winner was a full-stack Instagram giveaway tool built for a client who was tired
            of paying monthly subscriptions. Paste a post URL — the tool scraped every comment without any
            API keys, filtered out bots and duplicates, and picked verifiably random winners.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tool" className="neo-btn-primary text-xl py-6 px-10 flex items-center justify-center gap-3 group">
              Explore the Tool <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link href="/spin-the-wheel" className="neo-btn-secondary text-xl py-6 px-10 flex items-center justify-center gap-3">
              Free Tools Still Work
            </Link>
          </div>
        </div>

        {/* What the service did */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">What the Service Did</h2>
            <p className="text-slate-600 font-medium max-w-2xl mx-auto">
              The backend handled four core functions. The client-side tools below still run entirely in your browser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-4 border-black bg-white shadow-neo p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`${feature.color} text-white p-3 border-2 border-black`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-black uppercase">{feature.title}</h3>
                </div>
                <p className="font-medium text-slate-700 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Free tools still working */}
        <section className="border-4 border-black bg-primary text-white p-8 md:p-12 shadow-neo space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase">These Still Work — Try Them</h2>
            <p className="font-medium opacity-90 max-w-xl mx-auto">
              The wheel, name picker, and option picker run entirely in your browser. No backend needed.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {freeTools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.link}
                className="border-4 border-black bg-white text-black shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all block overflow-hidden"
              >
                <div className={`${tool.color} text-white p-4 border-b-4 border-black flex items-center gap-2`}>
                  {tool.icon}
                  <h3 className="font-black uppercase text-sm">{tool.name}</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-slate-600">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Built by Certified Random */}
        <section className="border-4 border-black bg-white p-8 md:p-12 shadow-neo text-center space-y-6">
          <div className="inline-block bg-black text-white font-black px-4 py-1 text-xs uppercase tracking-widest">
            Built by
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tight">
            <span className="text-primary">Certified</span> Random
          </h2>
          <p className="text-lg font-bold text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Pick Us A Winner was designed and built by Certified Random — a studio that builds tools and
            products for creators. The client no longer needed the live service, so the backend was retired.
            The interface is preserved here as a portfolio piece.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/how-it-works" className="neo-btn-secondary flex items-center justify-center gap-2">
              How the Picker Worked <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/tool" className="neo-btn-primary flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> View the Tool Interface
            </Link>
          </div>
        </section>

      </div>
    </Layout>
  );
}
