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
    "url": "https://giveaway-engine.com/how-it-works",
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
        "acceptedAnswer": { "@type": "Answer", "text": "Fair winner selection requires three things: (1) cryptographically secure randomness — not Math.random(), (2) uniform distribution where every participant has equal probability, and (3) duplicate removal so one person can't enter multiple times. PickUsAWinner implements all three using the Web Crypto API and Fisher-Yates shuffle." }
      },
      {
        "@type": "Question",
        "name": "What is the Fisher-Yates shuffle algorithm?",
        "acceptedAnswer": { "@type": "Answer", "text": "The Fisher-Yates shuffle (also known as the Knuth shuffle) is a proven algorithm that produces an unbiased random permutation of a sequence. It works by iterating from the last element to the first, swapping each element with a randomly selected element from those remaining. Combined with crypto.getRandomValues(), it guarantees every permutation is equally likely." }
      },
      {
        "@type": "Question",
        "name": "What is the difference between Math.random() and crypto.getRandomValues()?",
        "acceptedAnswer": { "@type": "Answer", "text": "Math.random() is a pseudo-random number generator (PRNG) that uses a deterministic algorithm. Given the same seed, it produces the same sequence. crypto.getRandomValues() is a cryptographically secure random number generator (CSPRNG) that draws entropy from the operating system. It is unpredictable and suitable for security-sensitive applications like fair random selection." }
      },
      {
        "@type": "Question",
        "name": "How does PickUsAWinner detect fraud in giveaways?",
        "acceptedAnswer": { "@type": "Answer", "text": "Our fraud detection system scores each entry based on multiple factors: duplicate usernames, comment length, emoji-only comments, repetitive text patterns, and account age signals. Entries with high fraud scores are flagged and can be automatically excluded, ensuring only legitimate participants are eligible to win." }
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
            Transparency is our core value. Here's exactly how we ensure every selection is cryptographically fair, unbiased, and verifiable.
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
              Every random selection in PickUsAWinner — whether it's picking an Instagram comment winner, spinning the wheel,
              or choosing a random name — uses the same battle-tested approach:
            </p>

            <div className="border-2 border-black p-6 bg-slate-50 space-y-4">
              <h3 className="font-black text-lg text-black">Step 1: Cryptographic Random Number Generation</h3>
              <p>
                We use the <strong>Web Crypto API</strong> (<code>crypto.getRandomValues()</code>) to generate random numbers.
                Unlike <code>Math.random()</code>, which is a pseudo-random number generator (PRNG) that can be predicted if the
                seed is known, the Web Crypto API draws entropy from the operating system's random number generator. This is the
                same source of randomness used in encryption, TLS/SSL, and other security-critical applications.
              </p>
            </div>

            <div className="border-2 border-black p-6 bg-slate-50 space-y-4">
              <h3 className="font-black text-lg text-black">Step 2: Fisher-Yates Shuffle</h3>
              <p>
                When we need to select from a list (like comments or names), we use the <strong>Fisher-Yates shuffle algorithm</strong>
                (also called the Knuth shuffle). This algorithm produces an unbiased permutation of the array — meaning every possible
                ordering is equally likely. It works by iterating through the array from end to start, swapping each element with a
                randomly chosen element from those that haven't been visited yet.
              </p>
              <p>
                This is mathematically proven to produce a uniform distribution across all <em>n!</em> possible permutations,
                guaranteeing that no participant is favored over any other.
              </p>
            </div>

            <div className="border-2 border-black p-6 bg-slate-50 space-y-4">
              <h3 className="font-black text-lg text-black">Step 3: Selection Without Replacement</h3>
              <p>
                When picking multiple winners, we use <strong>selection without replacement</strong>. This means once a name is
                picked, it's removed from the pool. The next winner is drawn from the remaining entries. This ensures no person
                can win twice in the same draw, and every remaining participant's probability increases fairly.
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
              For Instagram giveaways, we go beyond simple randomness. Our anti-fraud system analyzes every comment
              and assigns a fraud score based on multiple signals:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Duplicate Detection", desc: "Same username commenting multiple times is flagged. Only unique entries count." },
                { title: "Comment Quality", desc: "Ultra-short or emoji-only comments that suggest bot behavior are scored higher." },
                { title: "Pattern Analysis", desc: "Repetitive text patterns, copy-paste comments, and template responses are detected." },
                { title: "Mention Validation", desc: "When giveaway rules require @mentions, we verify genuine usernames are tagged." },
                { title: "Keyword Filtering", desc: "Ensure entries include required hashtags or keywords to qualify." },
                { title: "Configurable Threshold", desc: "You control the fraud sensitivity. Strict for high-value prizes, relaxed for casual giveaways." },
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
            <p>We take privacy seriously. Here's exactly what happens to your data:</p>

            <ul className="space-y-3">
              {[
                "Spin the Wheel, Name Picker, and Option Picker process everything locally in your browser. No data is ever sent to our servers.",
                "Instagram comment data is fetched server-side (necessary to access Instagram's API), processed for winner selection, and then discarded. We do not store comment data permanently.",
                "Your email is only used for scheduled giveaway results. We never send marketing emails or share your email with third parties.",
                "We use essential cookies only for session management. No tracking cookies, no third-party analytics.",
                "No participant data (names, comments, usernames) is ever sold or shared.",
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
            <h2 className="text-3xl font-black uppercase">Why Not Just Use Math.random()?</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-black text-left">
              <thead>
                <tr className="bg-black text-white">
                  <th className="p-3 font-black uppercase text-sm border-2 border-black">Feature</th>
                  <th className="p-3 font-black uppercase text-sm border-2 border-black">Math.random()</th>
                  <th className="p-3 font-black uppercase text-sm border-2 border-black">crypto.getRandomValues()</th>
                </tr>
              </thead>
              <tbody className="font-medium">
                <tr><td className="p-3 border-2 border-black font-bold">Randomness Source</td><td className="p-3 border-2 border-black">Algorithm (PRNG)</td><td className="p-3 border-2 border-black bg-green-50">OS entropy (CSPRNG)</td></tr>
                <tr><td className="p-3 border-2 border-black font-bold">Predictable?</td><td className="p-3 border-2 border-black bg-red-50">Yes, if seed is known</td><td className="p-3 border-2 border-black bg-green-50">No</td></tr>
                <tr><td className="p-3 border-2 border-black font-bold">Suitable for Crypto</td><td className="p-3 border-2 border-black bg-red-50">No</td><td className="p-3 border-2 border-black bg-green-50">Yes</td></tr>
                <tr><td className="p-3 border-2 border-black font-bold">Fair for Giveaways</td><td className="p-3 border-2 border-black bg-red-50">Questionable</td><td className="p-3 border-2 border-black bg-green-50">Guaranteed</td></tr>
                <tr><td className="p-3 border-2 border-black font-bold">Browser Support</td><td className="p-3 border-2 border-black">All browsers</td><td className="p-3 border-2 border-black bg-green-50">All modern browsers</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="border-4 border-black bg-primary text-white p-8 md:p-12 shadow-neo text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black uppercase">Ready to Pick Fair Winners?</h2>
          <p className="text-lg font-bold opacity-90 max-w-2xl mx-auto">
            Use our suite of random selection tools — all built with the same cryptographic fairness guarantees.
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
