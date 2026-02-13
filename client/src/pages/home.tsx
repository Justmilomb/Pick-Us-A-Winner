import Layout from "@/components/layout";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Zap, ShieldCheck, Sparkles, Instagram, Youtube, Facebook, Twitter } from "lucide-react";
import heroImage from "@/assets/hero-giveaway.png";
import { SEO } from "@/components/seo";
import { AdBanner } from "@/components/AdBanner";

export default function Home() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does PickUsAWinner pick giveaway winners?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PickUsAWinner uses a certified random selection algorithm to pick winners from Instagram comments. You can filter by keywords, mentions, and exclude duplicates to ensure fair selection."
        }
      },
      {
        "@type": "Question",
        "name": "Is PickUsAWinner free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, PickUsAWinner is 100% free to use. There are no hidden fees or premium subscriptions required."
        }
      },
      {
        "@type": "Question",
        "name": "Can I schedule giveaways?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, PickUsAWinner allows you to schedule giveaways to run automatically at a specific date and time. You'll receive an email with results when the giveaway completes."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Pick Us A Winner - Instagram Giveaway Tool"
        description="The fastest and fairest way to pick winners for your Instagram giveaways. Automated, transparent, and 100% free. Pick winners from comments with advanced filtering options."
        url="/"
        structuredData={faqStructuredData}
      />
      <div className="space-y-10 sm:space-y-14 md:space-y-20 pb-10 sm:pb-16">

        {/* Hero Section */}
        <section className="relative pt-4 sm:pt-8 md:pt-12 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-start lg:min-h-0">
              <div className="space-y-6 sm:space-y-8 md:space-y-10 z-20 relative text-center lg:text-left order-2 lg:order-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block bg-accent text-white font-black px-3 sm:px-6 py-1.5 sm:py-2 border-2 sm:border-4 border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-neo uppercase tracking-wider sm:tracking-widest transform -rotate-2 text-sm sm:text-base"
                >
                  🚀 #1 Pick Us A Winner Tool
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.85] tracking-tighter italic"
                >
                  GIVEAWAY <br className="hidden sm:block" />
                  <span className="text-primary drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] not-italic">
                    GENERATOR.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 max-w-xl mx-auto lg:mx-0 leading-tight px-2 sm:px-0"
                >
                  The #1 Instagram Comment Scraper & Giveaway Picker for creators. Fast, fair, and 100% free.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center lg:justify-start px-4 sm:px-0"
                >
                  <Link href="/tool" className="neo-btn-primary text-lg sm:text-xl md:text-2xl py-4 sm:py-6 md:py-8 px-6 sm:px-8 md:px-10 flex items-center justify-center gap-2 sm:gap-3 group">
                    Instagram Picker <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <a href="#how-it-works" className="neo-btn-secondary text-lg sm:text-xl md:text-2xl py-4 sm:py-6 md:py-8 px-6 sm:px-8 md:px-10 flex items-center justify-center">
                    How it Works
                  </a>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative mt-8 lg:mt-0 order-1 lg:order-2 flex justify-center lg:justify-end"
              >
                <div className="relative w-full max-w-md lg:max-w-lg">
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-full h-full bg-secondary border-2 sm:border-4 border-black z-0 shadow-[4px_4px_0px_0px_#000] sm:shadow-neo-lg"></div>
                  <img
                    src={heroImage}
                    alt="Pick Us A Winner - The Ultimate Instagram Comment Picker"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    width="600"
                    height="400"
                    className="relative z-10 w-full border-2 sm:border-4 border-black bg-white p-2 sm:p-4 shadow-[4px_4px_0px_0px_#000] sm:shadow-neo-lg object-contain"
                    style={{ aspectRatio: '3/2' }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Marquee with better branding */}
        <section className="full-bleed bg-primary text-white py-4 sm:py-6 md:py-8 border-y-4 sm:border-y-[6px] border-black overflow-hidden whitespace-nowrap rotate-1">
          <div className="flex gap-8 sm:gap-16 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] animate-marquee">
            <span>Verified Random • Pick Us A Winner • Anti-Cheat • Open Source • Verified Random • Anti-Cheat</span>
            <span>Verified Random • Pick Us A Winner • Anti-Cheat • Open Source • Verified Random • Anti-Cheat</span>
          </div>
        </section>

        {/* AdSense Banner */}
        <section className="container mx-auto px-4">
          <AdBanner type="adsense" className="w-full" />
        </section>

        {/* Steps Section */}
        <section id="how-it-works" className="py-8 sm:py-12 px-2 sm:px-4 md:px-0">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black bg-white inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-4 sm:border-[6px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase">
              3 SIMPLE STEPS
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0 border-4 sm:border-[6px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            {[
              { title: "Paste Link", desc: "Copy your post URL from Instagram.", icon: <Zap className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />, bgColor: "bg-[#FFDA44]" },
              { title: "Set Rules", desc: "Require hashtags, mentions, or keywords.", icon: <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />, bgColor: "bg-[#A733F4]" },
              { title: "Pick Winner", desc: "Let our randomizer choose fairly.", icon: <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />, bgColor: "bg-[#FF338D]" }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col items-center text-center gap-3 sm:gap-4 md:gap-6 border-b-4 sm:border-b-[6px] md:border-b-0 md:border-r-[6px] last:border-0 border-black ${step.bgColor} text-black`}
              >
                <div className="bg-white border-2 sm:border-4 border-black p-3 sm:p-4 md:p-6 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                  {step.icon}
                </div>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-black uppercase tracking-tight">{step.title}</h3>
                  <p className="font-bold text-sm sm:text-base md:text-lg lg:text-xl opacity-90 leading-snug px-2 sm:px-4 text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] sm:drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tools Hierarchy: 1. Instagram (main) 2. Working mini tools 3. Coming soon → Instagram */}
        <section className="container mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-black uppercase mb-8 text-center">All Our Tools</h2>
          <div className="space-y-10 max-w-4xl mx-auto">
            {/* Tier 1: Main - Instagram */}
            <div className="border-4 border-black bg-primary/10 p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Main Tool</p>
              <Link href="/tool" className="flex items-center gap-4 group">
                <div className="bg-instagram p-3 border-2 border-black text-white">
                  <Instagram className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-black uppercase group-hover:text-primary transition-colors">Instagram Giveaway Picker</h3>
                  <p className="text-sm font-medium text-muted-foreground">Pick random winners from comments. Filter, schedule, done.</p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Tier 2: Working mini tools */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Working Tools</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { href: "/instagram-comment-scraper", label: "Comment Scraper", desc: "Export Instagram comments" },
                  { href: "/wheel", label: "Wheel of Names", desc: "Spin to pick a winner" },
                  { href: "/picker", label: "Random Picker", desc: "Pick from any list" },
                ].map((t) => (
                  <Link key={t.href} href={t.href} className="block p-4 border-2 border-black bg-white hover:bg-secondary transition-colors group">
                    <h4 className="font-black uppercase group-hover:text-primary">{t.label}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tier 3: Coming soon → Instagram */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Coming Soon</p>
              <p className="text-sm font-medium text-muted-foreground mb-4">These will launch later. Use Instagram Picker for now.</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { href: "/youtube", label: "YouTube", icon: <Youtube className="w-4 h-4" /> },
                  { href: "/tiktok", label: "TikTok", icon: null },
                  { href: "/facebook-picker", label: "Facebook", icon: <Facebook className="w-4 h-4" /> },
                  { href: "/twitter-picker", label: "Twitter", icon: <Twitter className="w-4 h-4" /> },
                ].map((t) => (
                  <Link key={t.href} href={t.href} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 hover:border-black hover:text-black transition-colors text-sm font-bold">
                    {t.icon}
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Press / Media Kit - encourages backlinks */}
        <section className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Press & Media</p>
          <p className="text-base font-medium mb-4">
            Featured on creator blogs and giveaway guides. Link to us or download our logo.
          </p>
          <Link href="/press" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors">
            Get Media Kit & Download Logo
          </Link>
        </section>

        {/* Trustpilot Widget */}
        <section className="flex justify-center px-2 sm:px-0">
          <div className="trustpilot-widget" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="698f4179cd2640ab9bfcee91" data-style-height="52px" data-style-width="100%" data-token="c36af70c-349b-4644-b258-8f7e234df2de">
            <a href="https://www.trustpilot.com/review/pickusawinner.com" target="_blank" rel="noopener">Trustpilot</a>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 sm:py-12 px-2 sm:px-0">
          <motion.div
            whileInView={{ scale: [0.95, 1], rotate: [-1, 0] }}
            viewport={{ once: true }}
            className="bg-primary text-white p-6 sm:p-8 md:p-10 lg:p-14 border-2 sm:border-4 border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-neo-lg text-center space-y-4 sm:space-y-6 md:space-y-8"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black uppercase leading-none">Ready to give <br className="hidden sm:block" /> back?</h2>
            <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold max-w-2xl mx-auto opacity-90 px-2"> Join thousands of creators using Pick Us A Winner to grow their community through fair giveaways. </p>
            <div className="pt-2 sm:pt-4">
              <Link href="/tool" className="bg-white text-black border-2 sm:border-4 border-black p-4 sm:p-6 md:px-12 md:py-8 text-lg sm:text-xl md:text-2xl lg:text-4xl font-black uppercase shadow-[3px_3px_0px_0px_#000] sm:shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] sm:hover:shadow-neo-sm transition-all inline-block italic tracking-tighter">
                Pick a Winner Now!
              </Link>
            </div>
          </motion.div>
        </section>

      </div >
    </Layout >
  );
}