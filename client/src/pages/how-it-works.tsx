import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Shuffle, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "How PickUsAWinner Ensures Fair Random Winner Selection",
    "description": "Learn how our giveaway tools use cryptographic randomness, the Fisher-Yates shuffle algorithm, and fraud detection to guarantee fair winner selection.",
    "author": { "@type": "Organization", "name": "PickUsAWinner" },
    "publisher": { "@type": "Organization", "name": "PickUsAWinner" },
    "url": "https://pickusawinner.com/how-it-works",
    "datePublished": "2025-01-01",
    "dateModified": "2026-02-01"
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How to pick random winners fairly?",
        "acceptedAnswer": { "@type": "Answer", "text": "Fair winner selection needs three things: (1) truly random numbers that can't be predicted, (2) every person has an equal chance, and (3) nobody can enter more than once. PickUsAWinner does all three using secure browser-level randomness and proven shuffling methods." }
      },
      {
        "@type": "Question",
        "name": "What is the Fisher-Yates shuffle algorithm?",
        "acceptedAnswer": { "@type": "Answer", "text": "The Fisher-Yates shuffle is a well-known method for mixing up a list so that every possible order is equally likely. Think of it like putting all names in a hat and pulling them out one by one at random. It's been used and trusted for decades." }
      },
      {
        "@type": "Question",
        "name": "What is the difference between Math.random() and crypto.getRandomValues()?",
        "acceptedAnswer": { "@type": "Answer", "text": "Math.random() uses a simple formula that can technically be predicted. crypto.getRandomValues() gets its randomness from your device's hardware, making it impossible to predict. It's the same kind of randomness used for banking and encryption — way more secure and fair." }
      },
      {
        "@type": "Question",
        "name": "How does PickUsAWinner detect fraud in giveaways?",
        "acceptedAnswer": { "@type": "Answer", "text": "We check every comment for signs of cheating: duplicate accounts, spammy or copy-paste comments, bot-like patterns, and more. Suspicious entries get flagged, and you can choose to exclude them so only real people can win." }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="How It Works - Fair Random Winner Selection Explained"
        description="Learn how PickUsAWinner ensures fair random winner selection using cryptographic randomness, the Fisher-Yates shuffle algorithm, and anti-fraud detection. Understand the technology behind our giveaway picker, spin wheel, and name picker."
        keywords="how to pick random winner, fair random generator explained, fisher-yates shuffle, cryptographic random, how giveaway picker works, random selection algorithm, fair giveaway, verifiable randomness, instagram giveaway rules, how to run a fair giveaway, random winner selection, giveaway best practices"
        url="/how-it-works"
        structuredData={structuredData}
      />
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter">
            How <span className="text-primary">It Works</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-700 max-w-3xl mx-auto">
            We believe you should know exactly how your winners get picked. Here's a plain breakdown of what happens behind the scenes.
          </p>
        </div>

        {/* The Algorithm */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white p-3 border-2 border-black">
              <Shuffle className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black uppercase">The Algorithm</h2>
          </div>

          <div className="space-y-4 text-slate-700 font-medium leading-relaxed">
            <p>
              Whether you're picking an Instagram winner, spinning the wheel, or drawing a name — we use the same
              proven method every time:
            </p>

            <div className="border-2 border-black p-6 bg-slate-50 space-y-4">
              <h3 className="font-black text-lg text-black">Step 1: Truly Random Numbers</h3>
              <p>
                We use a secure random number generator built into your browser (the <strong>Web Crypto API</strong>).
                Unlike the basic <code>Math.random()</code> that most sites use, this one can't be predicted or gamed.
                It's the same tech used to keep your bank logins safe.
              </p>
            </div>

            <div className="border-2 border-black p-6 bg-slate-50 space-y-4">
              <h3 className="font-black text-lg text-black">Step 2: Shuffle Everything Fairly</h3>
              <p>
                We shuffle your entire list of entries using a method called the <strong>Fisher-Yates shuffle</strong>.
                Think of it like putting every name in a hat and mixing them up perfectly — every possible order is
                equally likely. Nobody gets an unfair advantage based on when they commented or where they are in the list.
              </p>
            </div>

            <div className="border-2 border-black p-6 bg-slate-50 space-y-4">
              <h3 className="font-black text-lg text-black">Step 3: Pick Winners, No Repeats</h3>
              <p>
                When picking multiple winners, once someone is chosen, they're taken out of the pool. The next
                winner comes from whoever is left. Nobody can win twice in the same draw, and everyone who's
                still in the pool has an equal shot.
              </p>
            </div>
          </div>
        </section>

        {/* Fraud Detection */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-accent text-white p-3 border-2 border-black">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black uppercase">Fraud Detection</h2>
          </div>

          <div className="space-y-4 text-slate-700 font-medium leading-relaxed">
            <p>
              For Instagram giveaways, we don't just pick randomly — we also check for cheaters. Every comment
              gets a fraud score based on a few things:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Duplicate Comments", desc: "If someone comments multiple times, we catch it. Only one entry per person." },
                { title: "Suspicious Comments", desc: "Super short or spammy-looking comments get flagged as possible bot activity." },
                { title: "Copy-Paste Detection", desc: "We spot repeated text and template comments that bots like to use." },
                { title: "Mention Checking", desc: "If your rules say 'tag 2 friends', we check that real usernames are actually tagged." },
                { title: "Keyword / Emoji Filtering", desc: "Make sure entries include the right hashtag, emoji, or word to qualify." },
                { title: "You're in Control", desc: "You decide how strict the fraud filter is. Tight for big prizes, relaxed for casual giveaways." },
              ].map((item, i) => (
                <div key={i} className="border-2 border-black p-4 bg-slate-50">
                  <h4 className="font-black text-sm uppercase text-black mb-1">{item.title}</h4>
                  <p className="text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy & Data */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-secondary text-black p-3 border-2 border-black">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black uppercase">Privacy & Data Handling</h2>
          </div>

          <div className="space-y-4 text-slate-700 font-medium leading-relaxed">
            <p>Here's what happens with your data (short version: we don't keep it):</p>

            <ul className="space-y-3">
              {[
                "The wheel, name picker, and option picker all run in your browser. Nothing gets sent to us.",
                "Instagram comments are grabbed from Instagram, used to pick winners, then thrown away. We don't save them.",
                "Your email is only used to send you giveaway results. No spam, no marketing, no sharing.",
                "We only use basic cookies to keep you logged in. No tracking, no ads following you around.",
                "We never sell or share anyone's names, comments, or usernames. Period.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="bg-primary text-white px-2 py-0.5 text-xs font-black border border-black mt-0.5 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Comparison */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white p-3 border-2 border-black">
              <Eye className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black uppercase">Why Our Randomness Is Better</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-black text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="p-3 font-black uppercase text-sm border-2 border-black">Feature</th>
                  <th className="p-3 font-black uppercase text-sm border-2 border-black">Basic Random (most sites)</th>
                  <th className="p-3 font-black uppercase text-sm border-2 border-black">Secure Random (what we use)</th>
                </tr>
              </thead>
              <tbody className="font-medium">
                <tr><td className="p-3 border-2 border-black font-bold">Where it comes from</td><td className="p-3 border-2 border-black">Simple formula</td><td className="p-3 border-2 border-black bg-green-50">Your device's hardware</td></tr>
                <tr><td className="p-3 border-2 border-black font-bold">Can someone predict it?</td><td className="p-3 border-2 border-black bg-red-50">Yes, with effort</td><td className="p-3 border-2 border-black bg-green-50">No</td></tr>
                <tr><td className="p-3 border-2 border-black font-bold">Used for security?</td><td className="p-3 border-2 border-black bg-red-50">No</td><td className="p-3 border-2 border-black bg-green-50">Yes</td></tr>
                <tr><td className="p-3 border-2 border-black font-bold">Fair for giveaways?</td><td className="p-3 border-2 border-black bg-red-50">Not really</td><td className="p-3 border-2 border-black bg-green-50">100%</td></tr>
                <tr><td className="p-3 border-2 border-black font-bold">Works everywhere?</td><td className="p-3 border-2 border-black">All browsers</td><td className="p-3 border-2 border-black bg-green-50">All modern browsers</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="border-4 border-black bg-primary text-white p-8 md:p-12 shadow-neo text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black uppercase">Ready to Pick a Winner?</h2>
          <p className="text-lg font-bold opacity-90 max-w-2xl mx-auto">
            All our tools use the same fair picking method. Try one out — it takes seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tool" className="bg-white text-black border-4 border-black py-4 px-8 font-black uppercase shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all inline-flex items-center gap-2">
              Instagram Picker <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/spin-the-wheel" className="bg-secondary text-black border-4 border-black py-4 px-8 font-black uppercase shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all">
              Spin the Wheel
            </Link>
            <Link href="/random-name-picker" className="bg-accent text-white border-4 border-black py-4 px-8 font-black uppercase shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all">
              Name Picker
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqData.mainEntity.map((faq, i) => (
              <div key={i} className="border-4 border-black bg-white p-6 shadow-neo-sm">
                <h3 className="font-black text-lg mb-2">{faq.name}</h3>
                <p className="text-slate-700 font-medium">{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      </div>
    </Layout>
  );
}
