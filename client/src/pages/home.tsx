import Layout from "@/components/layout";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Zap, ShieldCheck, Sparkles, RotateCcw, Users, Dice5, Instagram } from "lucide-react";
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
          "text": "PickUsAWinner uses secure random number generation to pick winners fairly. Every participant has an equal chance of winning. For Instagram giveaways, we also filter by keywords, emojis, mentions, and remove duplicate or fake entries."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to sign up or log in to use PickUsAWinner?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. You don't need to sign up or log in. Just open the tool and use it. The wheel, name picker, and option picker are totally free. Instagram comment picking has a small one-time cost — no subscriptions."
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
          "text": "PickUsAWinner has several free tools: Instagram Comment Picker for giveaways, Spin the Wheel for random picks, Random Name Picker for drawing names, and more platform pickers coming soon (YouTube, TikTok, Facebook). All picks are truly random and fair."
        }
      },
      {
        "@type": "Question",
        "name": "Is the random selection truly fair?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We use the same type of secure randomness that banks and encryption software use. It's not basic Math.random() — it's the real deal, so every pick is truly fair."
        }
      }
    ]
  };

  const orgStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PickUsAWinner",
    "url": "https://pickusawinner.com",
    "description": "The easiest way to pick random winners online. Instagram comment picker, spin the wheel, name picker, and more. Used by thousands of creators.",
    "sameAs": []
  };

  return (
    <Layout>
      <SEO
        title="Random Name Picker & Instagram Giveaway Generator | No Signup"
        description="Pick random winners from Instagram comments instantly. No signup, no login, one-time payment. Spin the wheel, random name picker, comment picker & giveaway generator. Trusted by creators. Cryptographically fair."
        keywords="pick us a winner, pick me a winner, instagram giveaway generator, instagram comment picker, random name picker, spin the wheel, giveaway generator, random winner selector, no signup giveaway tool, wheel of names, comment picker, giveaway maker"
        url="/"
        structuredData={faqStructuredData}
      />
      <div className="space-y-8 sm:space-y-10 md:space-y-12 pb-8 sm:pb-12">

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
                  Trusted by Creators Worldwide
                  No Signup • No Login • One-Time Pay
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter italic"
                >
                  PICK US <br className="hidden sm:block" />
                  <span className="text-primary sm:drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] not-italic">A WINNER.</span>
                  {" "}GIVEAWAY <br className="hidden sm:block" />
                  <span className="text-primary sm:drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] not-italic">GENERATOR.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base sm:text-lg md:text-xl font-bold text-slate-800 max-w-xl mx-auto lg:mx-0 leading-tight px-2 sm:px-0"
                >
                  Pick random winners from Instagram comments, spin a wheel, or draw names from a list. It's fast, fair, and easy. Free to set up — just pay once (£2.50) when you're ready. No subscriptions ever.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center lg:justify-start px-4 sm:px-0"
                >
                  <Link href="/tool" className="neo-btn-primary text-base sm:text-lg md:text-xl py-3 sm:py-4 md:py-5 px-5 sm:px-6 md:px-8 flex items-center justify-center gap-2 sm:gap-3 group">
                    Instagram Picker <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <Link href="/random-name-picker" className="neo-btn-secondary text-base sm:text-lg md:text-xl py-3 sm:py-4 md:py-5 px-5 sm:px-6 md:px-8 flex items-center justify-center">
                    Name Picker
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative mt-8 lg:mt-0 order-1 lg:order-2 flex justify-center lg:justify-end"
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

        {/* Single Marquee - infinite scroll, compact */}
        <section className="bg-primary text-white py-3 sm:py-4 -mx-4 sm:-mx-6 md:-mx-8 border-y-2 sm:border-y-4 border-black overflow-hidden whitespace-nowrap rotate-1">
          <div className="flex gap-0 min-w-max animate-marquee [&>span]:pr-8 sm:[&>span]:pr-16">
            <span className="flex-shrink-0 text-sm sm:text-base md:text-lg font-black uppercase tracking-wider">Pick Us A Winner • Spin the Wheel • Random Name Picker • No Signup • No Login • One-Time Pay • Instagram Giveaway Generator</span>
            <span className="flex-shrink-0 text-sm sm:text-base md:text-lg font-black uppercase tracking-wider">Pick Us A Winner • Spin the Wheel • Random Name Picker • No Signup • No Login • One-Time Pay • Instagram Giveaway Generator</span>
          </div>
        </section>

        {/* Tools Showcase — This is critical for SEO and cross-linking */}
        <section className="py-8 sm:py-12 px-2 sm:px-4 md:px-0">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black bg-white inline-block px-3 sm:px-5 py-2 border-2 sm:border-4 border-black shadow-neo uppercase">
              Our Free Tools
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Instagram Comment Picker",
                desc: "Grab all the comments from any Instagram post. Filter by hashtags, emojis, mentions, or words. Remove duplicates and catch bots. Pick random winners fairly.",
                icon: <Instagram className="w-8 h-8" />,
                link: "/tool",
                color: "bg-[#E1306C]",
                tags: ["Giveaway Generator", "Comment Picker"],
              },
              {
                title: "Spin the Wheel",
                desc: "Add names, prizes, or choices and spin the wheel. Fun animation with truly random results. Great for live streams, classrooms, or just picking where to eat.",
                icon: <RotateCcw className="w-8 h-8" />,
                link: "/spin-the-wheel",
                color: "bg-[#833AB4]",
                tags: ["Random Wheel", "Prize Wheel"],
              },
              {
                title: "Random Name Picker",
                desc: "Paste in a list of names and pick winners at random. Pick one or multiple winners at once. Everything stays in your browser — nothing is saved or sent anywhere.",
                icon: <Users className="w-8 h-8" />,
                link: "/random-name-picker",
                color: "bg-[#FCAF45]",
                tags: ["Pick Names at Random", "Name Drawing"],
              },
              {
                title: "Random Option Picker",
                desc: "Can't decide? Type in your options and let the tool pick for you. Restaurants, movies, team assignments — whatever you need, we'll choose randomly.",
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

        {/* AdSense Banner */}
        <section className="container mx-auto px-4">
          <AdBanner type="adsense" className="w-full" />
        </section>

        {/* Steps - compact, link to full page */}
        <section className="py-4 sm:py-6 px-2 sm:px-4 md:px-0">
          <Link href="/how-it-works" className="block border-4 border-black bg-white p-4 sm:p-6 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="flex gap-2 sm:gap-4">
                {[<Zap key="1" className="w-10 h-10 text-[#FFDA44]" />, <ShieldCheck key="2" className="w-10 h-10 text-[#A733F4]" />, <CheckCircle key="3" className="w-10 h-10 text-[#FF338D]" />].map((icon, i) => (
                  <div key={i} className="p-2 border-2 border-black bg-white">{icon}</div>
                ))}
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-base sm:text-lg font-black uppercase">3 Simple Steps: Paste Link → Set Rules → Pick Winner</h3>
                <p className="text-sm font-medium text-muted-foreground mt-1">See how it works and why every pick is fair</p>
              </div>
              <ArrowRight className="w-6 h-6 flex-shrink-0" />
            </div>
          </Link>
        </section>

        {/* Why PickUsAWinner */}
        <section className="py-6 sm:py-8 px-2 sm:px-4 md:px-0">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase">Why People Use Pick Us A Winner</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Actually Fair", desc: "We use the same type of randomness that banks use for security. Everyone has an equal chance — no tricks, no bias.", icon: <ShieldCheck className="w-8 h-8" /> },
              { title: "No Subscriptions", desc: "Free tools forever. Instagram comments cost a one-time fee. No monthly charges, no hidden fees, no surprises.", icon: <Sparkles className="w-8 h-8" /> },
              { title: "Your Data Stays Private", desc: "The wheel, name picker, and option picker run right in your browser. We don't save or send your data anywhere.", icon: <CheckCircle className="w-8 h-8" /> },
              { title: "Catches Bots & Fakes", desc: "Our Instagram picker spots bots, duplicate comments, and sketchy accounts automatically. Only real entries count.", icon: <ShieldCheck className="w-8 h-8" /> },
              { title: "Works on Any Device", desc: "Use it on your phone, tablet, or computer. No app to download — just open the site and go.", icon: <Zap className="w-8 h-8" /> },
              { title: "Nothing Hidden", desc: "We show you exactly how the picking works. No black box — you can see how winners are chosen.", icon: <Sparkles className="w-8 h-8" /> },
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

        {/* Platform Support - compact */}
        <section className="py-4 sm:py-6 px-2 sm:px-4 md:px-0">
          <Link href="/coming-soon" className="block border-4 border-black bg-slate-50 p-4 sm:p-6 text-center hover:bg-slate-100 transition-colors">
            <p className="font-bold text-slate-700">Instagram is ready to use now. YouTube, TikTok, and Facebook are on the way.</p>
            <p className="text-sm text-primary font-black uppercase mt-1">View platform status →</p>
          </Link>
        </section>

        {/* Press / Media Kit - encourages backlinks */}
        <section className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Press & Media</p>
          <p className="text-base font-medium mb-4">
            Seen on creator blogs and giveaway guides. Feel free to link to us or grab our logo.
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
        <section className="py-6 sm:py-8 px-2 sm:px-0">
          <motion.div
            whileInView={{ scale: [0.95, 1], rotate: [-1, 0] }}
            viewport={{ once: true }}
            className="bg-primary text-white p-5 sm:p-6 md:p-8 border-2 sm:border-4 border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-neo-lg text-center space-y-3 sm:space-y-4 md:space-y-6"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase leading-none">Ready to Pick <br className="hidden sm:block" /> a Winner?</h2>
            <p className="text-sm sm:text-base md:text-lg font-bold max-w-2xl mx-auto opacity-90 px-2">
              Thousands of creators already use PickUsAWinner. Try it out — it takes less than a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 sm:pt-4">
              <Link href="/tool" className="bg-white text-black border-2 sm:border-4 border-black p-3 sm:p-4 md:px-8 md:py-4 text-base sm:text-lg md:text-xl font-black uppercase shadow-[3px_3px_0px_0px_#000] sm:shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] sm:hover:shadow-neo-sm transition-all inline-block italic tracking-tighter">
                Instagram Picker
              </Link>
              <Link href="/spin-the-wheel" className="bg-secondary text-black border-2 sm:border-4 border-black p-3 sm:p-4 md:px-8 md:py-4 text-base sm:text-lg md:text-xl font-black uppercase shadow-[3px_3px_0px_0px_#000] sm:shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] sm:hover:shadow-neo-sm transition-all inline-block italic tracking-tighter">
                Spin the Wheel
              </Link>
            </div>
          </motion.div>
        </section>

        {/* SEO Content — hidden but important for search engines */}
        <section className="px-2 sm:px-4 md:px-0 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase">The Easiest Way to Pick Random Winners</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-4 border-black bg-white p-6 shadow-neo-sm space-y-3">
              <h3 className="text-lg font-black uppercase">For Giveaway Creators</h3>
              <p className="font-medium text-slate-700 text-sm leading-relaxed">
                Running a giveaway? PickUsAWinner pulls all the comments from your Instagram post, lets you
                set your own rules (hashtags, emojis, mentions), removes duplicates, catches fake accounts,
                and picks <strong>truly random winners</strong>. No monthly fees — just a one-time £2.50 payment when you need credits.
              </p>
              <Link href="/instagram-giveaway-guide" className="text-primary font-black text-sm inline-flex items-center gap-1 hover:underline">
                Read our Instagram Giveaway Guide <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="border-4 border-black bg-white p-6 shadow-neo-sm space-y-3">
              <h3 className="text-lg font-black uppercase">For Everyone</h3>
              <p className="font-medium text-slate-700 text-sm leading-relaxed">
                Not running a giveaway? No worries. <strong>Spin the wheel</strong> for prizes or just for fun.
                Use the <strong>name picker</strong> for classrooms, raffles, Secret Santa, or team stuff.
                The <strong>option picker</strong> helps when you just can't decide. All free, all private — nothing
                gets saved or tracked.
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

