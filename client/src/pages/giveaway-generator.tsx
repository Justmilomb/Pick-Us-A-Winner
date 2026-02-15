import Layout from "@/components/layout";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { ArrowRight, Instagram, Youtube, Facebook, Sparkles, CheckCircle, Shield, Zap } from "lucide-react";

export default function GiveawayGenerator() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "PickUsAWinner - Free Giveaway Generator for Creators",
    "description": "The best free giveaway generator for Instagram, YouTube, TikTok, and Facebook. Trusted by creators. one-time payment (£2.50), no subscriptions. Pick random winners with verified fairness.",
    "url": "https://giveaway-engine.com/giveaway-generator",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web Browser",
    "offers": { "@type": "Offer", "price": "2.50", "priceCurrency": "GBP", "description": "one-time payment (£2.50) for Instagram comment fetching. Free to configure. Spin wheel, name picker, option picker are free." },
    "author": { "@type": "Organization", "name": "PickUsAWinner" }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the best free giveaway generator?",
        "acceptedAnswer": { "@type": "Answer", "text": "PickUsAWinner is a free giveaway generator trusted by creators. It offers Instagram comment picking with anti-fraud detection, spin the wheel, random name picker, and scheduled giveaways. No monthly subscription â€” just a one-time payment (£2.50) option for premium features." }
      },
      {
        "@type": "Question",
        "name": "Can I use this for YouTube giveaways?",
        "acceptedAnswer": { "@type": "Answer", "text": "YouTube comment picking is coming soon. In the meantime, you can use our Random Name Picker or Spin the Wheel to pick winners from your YouTube comments manually. Just copy the commenter names and paste them in." }
      },
      {
        "@type": "Question",
        "name": "Is this giveaway generator free?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes! Basic features including the spin wheel, name picker, and option picker are 100% free. Instagram comment fetching requires a one-time payment each time you run winner selection or schedule a giveaway, with no recurring subscriptions." }
      },
      {
        "@type": "Question",
        "name": "How do I run a fair giveaway?",
        "acceptedAnswer": { "@type": "Answer", "text": "A fair giveaway needs verifiable randomness, duplicate removal, and fraud detection. PickUsAWinner uses cryptographic random selection (Web Crypto API), automatically detects duplicate entries, and has built-in fraud scoring to ensure only legitimate participants can win." }
      }
    ]
  };

  const platforms = [
    {
      name: "Instagram",
      icon: <Instagram className="w-8 h-8" />,
      status: "live",
      description: "Fetch comments directly from any Instagram post. Filter by keywords, mentions, hashtags. Remove duplicates and detect fraud automatically.",
      link: "/tool",
      color: "bg-[#E1306C]",
    },
    {
      name: "YouTube",
      icon: <Youtube className="w-8 h-8" />,
      status: "coming-soon",
      description: "YouTube comment picking is coming soon. Use our Name Picker or Spin the Wheel in the meantime.",
      link: "/random-name-picker",
      color: "bg-[#FF0000]",
    },
    {
      name: "TikTok",
      icon: <Sparkles className="w-8 h-8" />,
      status: "coming-soon",
      description: "TikTok giveaway support is coming soon. Copy commenter names and use our Random Name Picker today.",
      link: "/random-name-picker",
      color: "bg-[#000000]",
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-8 h-8" />,
      status: "coming-soon",
      description: "Facebook giveaway integration is on our roadmap. Use our free tools to pick winners from any platform now.",
      link: "/random-name-picker",
      color: "bg-[#1877F2]",
    },
  ];

  return (
    <Layout>
      <SEO
        title="Free Giveaway Generator for Creators - Instagram, YouTube, TikTok, Facebook"
        description="The best free giveaway generator trusted by creators. Pick random winners for Instagram, YouTube, TikTok & Facebook giveaways. one-time payment (£2.50), no subscriptions. Verified fair random selection with anti-fraud detection."
        keywords="instagram giveaways tool, instagram giveaway tool, instagram giveaway generator, giveaway generator, giveaway maker, youtube giveaway, tiktok giveaway generator, facebook giveaway generator, instagram comments tool, instagram comment picker tool, comment picker generator, giveaway generators for creators, trusted by creators, one time payment giveaway generator, giveaway generators, free giveaway tool, social media giveaway, contest picker, raffle generator"
        url="/giveaway-generator"
        structuredData={structuredData}
      />
      <div className="space-y-12">
        {/* Hero */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block bg-accent text-white font-black px-6 py-2 border-4 border-black shadow-neo uppercase tracking-widest transform -rotate-1"
          >
            Trusted by Creators
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">
            The Free <br />
            <span className="text-primary">Giveaway Generator</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-700 max-w-3xl mx-auto">
            Run fair giveaways on Instagram, YouTube, TikTok, and Facebook. Cryptographically random winner selection.
            No monthly fees â€” one-time payment (£2.50) for premium, free tools forever.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tool" className="neo-btn-primary text-xl py-6 px-10 flex items-center justify-center gap-3 group">
              Instagram Picker <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link href="/spin-the-wheel" className="neo-btn-secondary text-xl py-6 px-10 flex items-center justify-center gap-3">
              Spin the Wheel
            </Link>
          </div>
        </div>

        {/* Platform Cards - compact */}
        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-center">Supported Platforms</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {platforms.map((platform, i) => {
              const isComingSoon = platform.status === "coming-soon";
              return (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`border-4 border-black p-6 shadow-neo space-y-4 ${isComingSoon ? "bg-slate-100" : "bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${platform.color} text-white p-3 border-2 border-black ${isComingSoon ? "grayscale opacity-70" : ""}`}>
                        {platform.icon}
                      </div>
                      <h3 className={`text-2xl font-black uppercase ${isComingSoon ? "text-slate-500" : ""}`}>{platform.name}</h3>
                    </div>
                    {platform.status === "live" ? (
                      <span className="bg-green-500 text-white px-3 py-1 text-xs font-black uppercase border-2 border-black shadow-neo-sm">Live</span>
                    ) : (
                      <span className="bg-slate-400 text-slate-600 px-3 py-1 text-xs font-black uppercase border-2 border-black">Coming Soon</span>
                    )}
                  </div>
                  <p className={`font-medium ${isComingSoon ? "text-slate-500" : "text-slate-700"}`}>{platform.description}</p>
                  <Link
                    href={platform.link}
                    className={`text-center block py-3 text-sm font-black uppercase border-2 border-black ${isComingSoon ? "bg-slate-300 text-slate-600 hover:bg-slate-400" : "neo-btn-primary"}`}
                  >
                    {platform.status === "live" ? `Launch ${platform.name} Picker` : "Use Name Picker Instead"}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Why PickUsAWinner */}
        <section className="border-4 border-black bg-primary text-white p-8 md:p-12 shadow-neo space-y-8">
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-center">Why Creators Trust PickUsAWinner</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Shield className="w-10 h-10" />, title: "Verified Fairness", desc: "Cryptographic random selection using the Web Crypto API. Every participant has an equal chance. Anti-fraud detection removes bots and fake entries." },
              { icon: <Zap className="w-10 h-10" />, title: "No Subscriptions", desc: "Free tools forever. Instagram comment fetching uses a one-time credit system â€” no monthly fees, no recurring charges, no surprise bills." },
              { icon: <CheckCircle className="w-10 h-10" />, title: "Privacy First", desc: "We don't store your participant data. Comment data is processed and discarded. No tracking, no selling data, no third-party analytics." },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="bg-white text-primary border-2 border-black p-4 inline-block shadow-neo-sm">{item.icon}</div>
                <h3 className="text-xl font-black uppercase">{item.title}</h3>
                <p className="font-medium opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* All Tools */}
        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase text-center">
            <span className="text-primary">Our Complete Toolkit</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Instagram Comment Picker", desc: "Pick winners from Instagram post comments", link: "/tool", color: "bg-[#E1306C]", icon: <Instagram className="w-6 h-6" /> },
              { name: "Spin the Wheel", desc: "Add entries and spin for a random result", link: "/spin-the-wheel", color: "bg-[#FFDA44]", icon: <Sparkles className="w-6 h-6" /> },
              { name: "Random Name Picker", desc: "Enter names, pick winners at random", link: "/random-name-picker", color: "bg-[#FCAF45]", icon: <CheckCircle className="w-6 h-6" /> },
              { name: "Random Option Picker", desc: "Can't decide? Let randomness choose", link: "/random-option-picker", color: "bg-[#405DE6]", icon: <Zap className="w-6 h-6" /> },
            ].map((tool, i) => (
              <Link key={i} href={tool.link} className="border-4 border-black bg-white shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all block overflow-hidden">
                <div className={`${tool.color} text-white p-3 border-b-4 border-black flex items-center gap-2`}>
                  {tool.icon}
                  <h3 className="text-base font-black uppercase">{tool.name}</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-slate-600">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ - compact, link to full page */}
        <section className="space-y-4 text-center">
          <h2 className="text-2xl font-black uppercase">Questions?</h2>
          <p className="text-slate-700 font-medium max-w-xl mx-auto">How we pick winners, pricing, scheduling, and more.</p>
          <Link href="/faq" className="neo-btn-secondary inline-flex items-center gap-2">
            See FAQ <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      </div>
    </Layout>
  );
}


