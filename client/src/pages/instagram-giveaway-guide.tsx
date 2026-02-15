import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, AlertTriangle, BookOpen } from "lucide-react";

export default function InstagramGiveawayGuide() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "How to Run an Instagram Giveaway — The Complete Guide for 2026",
    "description": "Complete guide to running Instagram giveaways. Learn the rules, best practices for picking winners fairly, how to avoid scams, and how to grow your audience with comment-to-enter contests.",
    "author": { "@type": "Organization", "name": "PickUsAWinner" },
    "publisher": { "@type": "Organization", "name": "PickUsAWinner" },
    "url": "https://giveaway-engine.com/instagram-giveaway-guide",
    "datePublished": "2025-06-01",
    "dateModified": "2026-02-01"
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Are Instagram giveaways legal?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, Instagram giveaways are legal as long as you follow Instagram's Promotion Guidelines and applicable laws. You must include official rules, eligibility requirements (e.g., minimum age, geographic restrictions), and a disclaimer that the promotion is not sponsored, endorsed, or administered by Instagram." }
      },
      {
        "@type": "Question",
        "name": "How do I pick a random winner from Instagram comments?",
        "acceptedAnswer": { "@type": "Answer", "text": "Use a comment picker tool like PickUsAWinner. Paste your Instagram post URL, set your rules (required hashtags, mentions, keyword filters), and our tool fetches all comments, removes duplicates, detects fraud, and picks a cryptographically random winner." }
      },
      {
        "@type": "Question",
        "name": "How many winners should I pick for my giveaway?",
        "acceptedAnswer": { "@type": "Answer", "text": "It depends on your goals. Single-winner giveaways create more excitement and urgency. Multiple winners (3-5) increase participation because people feel they have a better chance. For large audiences (100k+), picking 3-5 winners is common." }
      },
      {
        "@type": "Question",
        "name": "What's the best Instagram giveaway comment picker?",
        "acceptedAnswer": { "@type": "Answer", "text": "PickUsAWinner is a free, transparent Instagram comment picker with features most tools lack: cryptographic random selection, fraud detection, duplicate removal, keyword/mention filtering, scheduled draws, and winner proof generation. No monthly subscription required." }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="How to Run an Instagram Giveaway - Complete Guide 2026"
        description="Complete guide to running Instagram giveaways in 2026. Learn Instagram promotion rules, how to pick winners fairly, best practices for engagement, and how to avoid scams. Free comment picker tool included."
        keywords="instagram giveaway rules, how to run instagram giveaway, instagram contest rules, instagram giveaway picker, how to pick instagram winner, instagram giveaway best practices, instagram comment picker, instagram promotion guidelines, giveaway rules template, how to do a giveaway on instagram"
        url="/instagram-giveaway-guide"
        structuredData={structuredData}
      />
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-block bg-secondary text-black font-black px-6 py-2 border-4 border-black shadow-neo uppercase tracking-widest">
            <BookOpen className="w-5 h-5 inline mr-2" />Complete Guide
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter">
            How to Run an <span className="text-primary">Instagram Giveaway</span>
          </h1>
          <p className="text-lg sm:text-xl font-bold text-slate-700 max-w-3xl mx-auto">
            Everything you need to know about running a successful, fair, and rule-compliant Instagram giveaway in 2026.
          </p>
        </div>

        {/* Quick Start */}
        <section className="border-4 border-black bg-primary text-white p-8 shadow-neo space-y-4">
          <h2 className="text-2xl font-black uppercase">Quick Start: Run a Giveaway in 3 Steps</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Create Your Post", desc: "Post your giveaway with clear rules: what to comment, who to tag, and the deadline." },
              { step: "2", title: "Paste the URL", desc: "Copy the Instagram post URL and paste it into PickUsAWinner's Instagram Picker." },
              { step: "3", title: "Pick Winners", desc: "Set your filters, click pick, and get a verifiably random winner in seconds." },
            ].map((item) => (
              <div key={item.step} className="bg-white/10 border-2 border-white/30 p-4 space-y-2">
                <span className="bg-white text-primary w-8 h-8 flex items-center justify-center font-black text-lg border-2 border-black">{item.step}</span>
                <h3 className="font-black text-lg">{item.title}</h3>
                <p className="text-sm font-medium opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/tool" className="bg-white text-black border-4 border-black py-4 px-8 font-black uppercase shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all inline-flex items-center gap-2 mt-4">
            Try It Free <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Instagram Rules */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-6">
          <h2 className="text-3xl font-black uppercase">Instagram Promotion Guidelines</h2>
          <div className="space-y-4 text-slate-700 font-medium leading-relaxed">
            <p>
              Instagram has specific rules for running promotions. Violating them can get your post removed or account restricted.
              Here's what you need to include:
            </p>

            <div className="space-y-3">
              <h3 className="text-xl font-black text-black flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Required Disclosures
              </h3>
              <ul className="space-y-2 ml-7">
                {[
                  "Official rules or a link to them",
                  "Eligibility requirements (age, location)",
                  "A clear statement that the promotion is not sponsored, endorsed, or administered by Instagram",
                  "A release of Instagram by each entrant",
                  "Start and end dates for the giveaway",
                  "How and when winners will be announced",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-black text-black flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Common Mistakes to Avoid
              </h3>
              <ul className="space-y-2 ml-7">
                {[
                  "Don't require participants to tag themselves in photos they're not in",
                  "Don't ask users to share on their Stories as an entry requirement (Instagram discourages this)",
                  "Don't run 'loop giveaways' that require following dozens of accounts",
                  "Don't use inaccurate tags or misleading content",
                  "Don't pick winners manually — use a verifiable random tool to avoid bias accusations",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-6">
          <h2 className="text-3xl font-black uppercase">Best Practices for Maximum Engagement</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Keep Entry Simple", desc: "Comment + tag 1 friend is the sweet spot. Complex rules reduce participation. 'Like + comment + tag 2 friends' works well." },
              { title: "Set a Clear Deadline", desc: "48-72 hours is optimal. Too short and you miss reach; too long and people forget. Use PickUsAWinner's scheduled draws." },
              { title: "Valuable, Relevant Prizes", desc: "Give away something your target audience actually wants. A prize relevant to your niche attracts followers who'll stay." },
              { title: "Announce Winner Publicly", desc: "Post the winner in Stories and comments. Tag them. This builds trust and encourages participation in future giveaways." },
              { title: "Use a Random Picker Tool", desc: "Manual selection opens you to bias accusations. Use PickUsAWinner for verifiable, cryptographically random results." },
              { title: "Require Qualifying Actions", desc: "Use keyword filters and mention requirements to ensure entries are valid. PickUsAWinner handles this automatically." },
            ].map((item, i) => (
              <div key={i} className="border-2 border-black p-4 bg-slate-50">
                <h3 className="font-black text-lg mb-2">{item.title}</h3>
                <p className="text-slate-700 font-medium text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Caption Template */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-6">
          <h2 className="text-3xl font-black uppercase">Giveaway Caption Template</h2>
          <div className="border-2 border-black bg-slate-50 p-6 font-mono text-sm leading-relaxed whitespace-pre-line">
{`🎉 GIVEAWAY TIME! 🎉

I'm giving away [PRIZE] to ONE lucky winner!

To enter:
1. Follow @[youraccount]
2. Like this post
3. Comment your favorite [topic] and tag 1 friend

Bonus entry: Share this to your Stories and tag me!

Winner will be picked randomly on [DATE] using @pickusawinner — a verified random selection tool.

Open to [LOCATION]. Must be 18+. Not sponsored by Instagram.

Good luck! 🍀

#giveaway #contest #win #free #[yourniche]`}
          </div>
        </section>

        {/* CTA */}
        <section className="border-4 border-black bg-accent text-white p-8 md:p-12 shadow-neo text-center space-y-6">
          <h2 className="text-3xl font-black uppercase">Ready to Pick Your Winners?</h2>
          <p className="text-lg font-bold opacity-90 max-w-2xl mx-auto">
            PickUsAWinner makes it easy. Paste your post URL, set your rules, and pick a verifiably fair winner in seconds.
          </p>
          <Link href="/tool" className="bg-white text-black border-4 border-black py-4 px-10 font-black uppercase shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-sm transition-all inline-flex items-center gap-2">
            Launch Instagram Picker <ArrowRight className="w-5 h-5" />
          </Link>
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
