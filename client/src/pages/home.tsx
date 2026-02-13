import Layout from "@/components/layout";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Zap, ShieldCheck, Sparkles, RotateCcw, Users, Dice5, Instagram } from "lucide-react";
import heroImage from "@/assets/hero-giveaway.png";
import { SEO } from "@/components/seo";

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
          "text": "PickUsAWinner uses the Web Crypto API for cryptographically secure random selection combined with the Fisher-Yates shuffle algorithm. This guarantees every participant has an equal chance of winning. For Instagram giveaways, we also filter by keywords, mentions, and exclude duplicate/fraudulent entries."
        }
      },
      {
        "@type": "Question",
        "name": "Is PickUsAWinner free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Our spin the wheel, random name picker, and random option picker tools are 100% free with no limits. Instagram comment fetching includes free credits, with additional credits available as a one-time purchase — no monthly subscriptions."
        }
      },
      {
        "@type": "Question",
        "name": "Can I schedule giveaways?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, PickUsAWinner allows you to schedule giveaways to run automatically at a specific date and time. You'll receive an email with results when the giveaway completes."
        }
      },
      {
        "@type": "Question",
        "name": "What tools does PickUsAWinner offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PickUsAWinner offers four free tools: (1) Instagram Comment Picker for giveaways, (2) Spin the Wheel for random selection with animation, (3) Random Name Picker for drawing names from a list, and (4) Random Option Picker for making random decisions. All tools use cryptographically fair randomness."
        }
      },
      {
        "@type": "Question",
        "name": "Is the random selection truly fair?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We use crypto.getRandomValues() — the same cryptographic randomness source used in encryption — instead of Math.random(). This is combined with the Fisher-Yates shuffle for mathematically proven uniform distribution. We also explain our algorithm transparently on our How It Works page."
        }
      }
    ]
  };

  const orgStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PickUsAWinner",
    "url": "https://giveaway-engine.com",
    "description": "The simplest random selection toolkit on the web. Instagram giveaway comment picker, spin the wheel, random name picker, and random option picker. Trusted by creators worldwide.",
    "sameAs": []
  };

  return (
    <Layout>
      <SEO
        title="Pick Us A Winner - Free Giveaway Picker, Spin the Wheel & Random Name Picker"
        description="The simplest random selection toolkit on the web. Instagram comment picker, spin the wheel, random name picker & option picker. Trusted by creators. Cryptographically fair. 100% free."
        keywords="pick us a winner, pick me a winner, instagram giveaway generator, comment picker generator, giveaway maker, instagram comment picker, spin the wheel, random wheel, random name picker, pick names at random, random option picker, giveaway generators for creators, trusted by creators, one time payment giveaway generator, giveaway generators, winner picker"
        url="/"
        structuredData={faqStructuredData}
      />
      <div className="space-y-16 sm:space-y-24 md:space-y-32 pb-16 sm:pb-32">

        {/* Hero Section */}
        <section className="relative pt-8 sm:pt-12 md:pt-24 lg:pt-32 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-24 items-center">
              <div className="space-y-6 sm:space-y-8 md:space-y-10 z-10 text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block bg-accent text-white font-black px-3 sm:px-6 py-1.5 sm:py-2 border-2 sm:border-4 border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-neo uppercase tracking-wider sm:tracking-widest transform -rotate-2 text-sm sm:text-base"
                >
                  Trusted by Creators Worldwide
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.85] tracking-tighter italic"
                >
                  PICK US <br className="hidden sm:block" />
                  <span className="text-primary drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] not-italic">
                    A WINNER.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 max-w-xl mx-auto lg:mx-0 leading-tight px-2 sm:px-0"
                >
                  The simplest random selection toolkit on the web. Instagram giveaways, spin the wheel, name picker & more — all cryptographically fair.
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
                  <Link href="/random-name-picker" className="neo-btn-secondary text-lg sm:text-xl md:text-2xl py-4 sm:py-6 md:py-8 px-6 sm:px-8 md:px-10 flex items-center justify-center">
                    Name Picker
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative mt-8 lg:mt-0"
              >
                <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 md:-top-10 md:-right-10 w-full h-full bg-secondary border-2 sm:border-4 border-black z-0 shadow-[4px_4px_0px_0px_#000] sm:shadow-neo-lg"></div>
                <img
                  src={heroImage}
                  alt="Pick Us A Winner - Instagram Giveaway Comment Picker, Spin the Wheel & Random Name Picker"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width="600"
                  height="400"
                  className="relative z-10 w-full border-2 sm:border-4 border-black bg-white p-2 sm:p-4 shadow-[4px_4px_0px_0px_#000] sm:shadow-neo-lg"
                  style={{ aspectRatio: '3/2' }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <section className="bg-primary text-white py-6 sm:py-10 md:py-14 -mx-4 sm:-mx-6 md:-mx-8 border-y-4 sm:border-y-[6px] border-black overflow-hidden whitespace-nowrap rotate-1">
          <div className="flex gap-8 sm:gap-16 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] animate-marquee">
            <span>Pick Us A Winner • Spin the Wheel • Random Name Picker • Giveaway Generator • Pick Me A Winner • Comment Picker</span>
            <span>Pick Us A Winner • Spin the Wheel • Random Name Picker • Giveaway Generator • Pick Me A Winner • Comment Picker</span>
          </div>
        </section>

        {/* Tools Showcase — This is critical for SEO and cross-linking */}
        <section className="py-8 sm:py-12 px-2 sm:px-4 md:px-0">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black bg-white inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-4 sm:border-[6px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase">
              Our Free Tools
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Instagram Comment Picker",
                desc: "Fetch comments from any Instagram post. Filter by keywords, mentions, hashtags. Auto-remove duplicates and detect fraud. Pick cryptographically random winners.",
                icon: <Instagram className="w-8 h-8" />,
                link: "/tool",
                color: "bg-[#E1306C]",
                tags: ["Giveaway Generator", "Comment Picker"],
              },
              {
                title: "Spin the Wheel",
                desc: "Add names, prizes, or options and spin for a random result. Smooth animation with cryptographically fair selection. Perfect for live giveaways and classroom picks.",
                icon: <RotateCcw className="w-8 h-8" />,
                link: "/spin-the-wheel",
                color: "bg-[#833AB4]",
                tags: ["Random Wheel", "Prize Wheel"],
              },
              {
                title: "Random Name Picker",
                desc: "Enter a list of names and pick winners at random. Uses Fisher-Yates shuffle with crypto randomness. Pick multiple winners at once. Data stays in your browser.",
                icon: <Users className="w-8 h-8" />,
                link: "/random-name-picker",
                color: "bg-[#FCAF45]",
                tags: ["Pick Names at Random", "Name Drawing"],
              },
              {
                title: "Random Option Picker",
                desc: "Can't decide? Enter your options and let cryptographic randomness choose for you. From restaurants to movies to team assignments — let fate decide.",
                icon: <Dice5 className="w-8 h-8" />,
                link: "/random-option-picker",
                color: "bg-[#405DE6]",
                tags: ["Decision Maker", "Random Choice"],
              },
            ].map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={tool.link} className="block border-4 border-black bg-white shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all h-full">
                  <div className={`${tool.color} text-white p-4 border-b-4 border-black flex items-center gap-3`}>
                    {tool.icon}
                    <h3 className="text-lg font-black uppercase leading-tight">{tool.title}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="font-medium text-slate-700 text-sm leading-relaxed">{tool.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {tool.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-wider bg-slate-100 border border-black px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Steps Section */}
        <section id="how-it-works" className="py-8 sm:py-12 px-2 sm:px-4 md:px-0">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black bg-white inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-4 sm:border-[6px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase">
              3 Simple Steps
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

        {/* Why PickUsAWinner */}
        <section className="py-8 sm:py-12 px-2 sm:px-4 md:px-0">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">Why Creators Trust Pick Us A Winner</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Cryptographic Fairness", desc: "We use the Web Crypto API — the same randomness source used in encryption — not Math.random(). Every participant has a mathematically equal chance.", icon: <ShieldCheck className="w-8 h-8" /> },
              { title: "No Subscriptions", desc: "Free tools forever. Instagram comment fetching uses a one-time credit system. No monthly fees, no recurring charges, no surprise bills.", icon: <Sparkles className="w-8 h-8" /> },
              { title: "Privacy First", desc: "Spin the wheel, name picker, and option picker run entirely in your browser. No data is sent to our servers. Instagram data is processed and discarded.", icon: <CheckCircle className="w-8 h-8" /> },
              { title: "Anti-Fraud Detection", desc: "Our Instagram picker automatically detects bots, duplicate entries, and suspicious patterns. Only legitimate participants are eligible to win.", icon: <ShieldCheck className="w-8 h-8" /> },
              { title: "Mobile-First Design", desc: "Every tool works beautifully on phones, tablets, and desktops. Pick winners on the go — no app download required.", icon: <Zap className="w-8 h-8" /> },
              { title: "Transparent Algorithm", desc: "We explain exactly how our randomness works. Fisher-Yates shuffle, crypto random, selection without replacement. Read our How It Works page.", icon: <Sparkles className="w-8 h-8" /> },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border-4 border-black bg-white p-6 shadow-neo-sm space-y-3"
              >
                <div className="bg-primary text-white p-3 border-2 border-black inline-block">{item.icon}</div>
                <h3 className="text-lg font-black uppercase">{item.title}</h3>
                <p className="font-medium text-slate-700 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/how-it-works" className="border-4 border-black bg-white py-3 px-8 font-black uppercase shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all inline-flex items-center gap-2">
              Learn How It Works <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Platform Support */}
        <section className="py-8 sm:py-12 px-2 sm:px-4 md:px-0">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">Giveaway Generator for Every Platform</h2>
            <p className="text-lg font-bold text-slate-600 mt-2 max-w-2xl mx-auto">
              Run giveaways on Instagram today. YouTube, TikTok, and Facebook support coming soon.
              Use our name picker or spin wheel for any platform right now.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Instagram", status: "Live", link: "/tool" },
              { name: "YouTube", status: "Coming Soon", link: "/random-name-picker" },
              { name: "TikTok", status: "Coming Soon", link: "/random-name-picker" },
              { name: "Facebook", status: "Coming Soon", link: "/random-name-picker" },
            ].map((platform) => (
              <Link key={platform.name} href={platform.link} className="border-4 border-black bg-white p-5 shadow-neo-sm hover:shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-center space-y-2">
                <h3 className="text-xl font-black uppercase">{platform.name}</h3>
                <span className={`inline-block px-3 py-1 text-xs font-black uppercase border-2 border-black ${
                  platform.status === "Live" ? "bg-green-500 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {platform.status}
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/giveaway-generator" className="text-primary font-black uppercase text-sm hover:underline underline-offset-4 inline-flex items-center gap-1">
              View all platform details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 sm:py-12 px-2 sm:px-0">
          <motion.div
            whileInView={{ scale: [0.95, 1], rotate: [-1, 0] }}
            viewport={{ once: true }}
            className="bg-primary text-white p-6 sm:p-10 md:p-16 lg:p-20 border-2 sm:border-4 border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-neo-lg text-center space-y-4 sm:space-y-6 md:space-y-8"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black uppercase leading-none">Ready to Pick <br className="hidden sm:block" /> a Winner?</h2>
            <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold max-w-2xl mx-auto opacity-90 px-2">
              Join thousands of creators using PickUsAWinner to run fair giveaways and grow their community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 sm:pt-4">
              <Link href="/tool" className="bg-white text-black border-2 sm:border-4 border-black p-4 sm:p-6 md:px-10 md:py-6 text-lg sm:text-xl md:text-2xl font-black uppercase shadow-[3px_3px_0px_0px_#000] sm:shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] sm:hover:shadow-neo-sm transition-all inline-block italic tracking-tighter">
                Instagram Picker
              </Link>
              <Link href="/spin-the-wheel" className="bg-secondary text-black border-2 sm:border-4 border-black p-4 sm:p-6 md:px-10 md:py-6 text-lg sm:text-xl md:text-2xl font-black uppercase shadow-[3px_3px_0px_0px_#000] sm:shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] sm:hover:shadow-neo-sm transition-all inline-block italic tracking-tighter">
                Spin the Wheel
              </Link>
            </div>
          </motion.div>
        </section>

        {/* SEO Content — hidden but important for search engines */}
        <section className="px-2 sm:px-4 md:px-0 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase">The Best Free Random Selection Toolkit</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-4 border-black bg-white p-6 shadow-neo-sm space-y-3">
              <h3 className="text-lg font-black uppercase">For Giveaway Creators</h3>
              <p className="font-medium text-slate-700 text-sm leading-relaxed">
                PickUsAWinner is the <strong>best free giveaway generator</strong> for creators on Instagram, YouTube, TikTok, and Facebook.
                Our <strong>Instagram comment picker</strong> fetches comments directly, filters by your rules, removes duplicates,
                detects fraud, and picks <strong>cryptographically random winners</strong>. No monthly subscription — just a
                one-time payment option for premium features. Trusted by thousands of creators worldwide.
              </p>
              <Link href="/instagram-giveaway-guide" className="text-primary font-black text-sm inline-flex items-center gap-1 hover:underline">
                Read our Instagram Giveaway Guide <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="border-4 border-black bg-white p-6 shadow-neo-sm space-y-3">
              <h3 className="text-lg font-black uppercase">For Everyone</h3>
              <p className="font-medium text-slate-700 text-sm leading-relaxed">
                Beyond giveaways, our tools help with any situation that needs fair random selection.
                <strong> Spin the wheel</strong> for prizes, decisions, or fun. Use the <strong>random name picker</strong> for
                classrooms, raffles, Secret Santa, or team building. The <strong>random option picker</strong> helps you make
                decisions when you can't choose. All tools are free, private (no data stored), and use
                <strong> cryptographic randomness</strong> for true fairness.
              </p>
              <Link href="/how-it-works" className="text-primary font-black text-sm inline-flex items-center gap-1 hover:underline">
                Learn how our algorithm works <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Organization structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgStructuredData) }} />
    </Layout>
  );
}
