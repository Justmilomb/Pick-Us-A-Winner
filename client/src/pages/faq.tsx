import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How does PickUsAWinner pick giveaway winners?",
    a: "PickUsAWinner uses the Web Crypto API for cryptographically secure random selection combined with the Fisher-Yates shuffle algorithm. This guarantees every participant has an equal chance of winning. For Instagram giveaways, we also filter by keywords, mentions, and exclude duplicate/fraudulent entries.",
  },
  {
    q: "Do I need to sign up or log in to use PickUsAWinner?",
    a: "No. PickUsAWinner requires no signup and no login. Free to configure. One-time payment (£2.50) required to fetch Instagram comments and pick winners. No subscription.",
  },
  {
    q: "Can I schedule giveaways?",
    a: "Yes, PickUsAWinner allows you to schedule giveaways to run automatically at a specific date and time. You'll receive an email with results when the giveaway completes.",
  },
  {
    q: "What tools does PickUsAWinner offer?",
    a: "PickUsAWinner offers four free tools: (1) Instagram Comment Picker for giveaways, (2) Spin the Wheel for random selection with animation, (3) Random Name Picker for drawing names from a list, and (4) Random Option Picker for making random decisions. All tools use cryptographically fair randomness.",
  },
  {
    q: "Is the random selection truly fair?",
    a: "Yes. We use crypto.getRandomValues() — the same cryptographic randomness source used in encryption — instead of Math.random(). This is combined with the Fisher-Yates shuffle for mathematically proven uniform distribution. We also explain our algorithm transparently on our How It Works page.",
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FAQPage() {
  return (
    <Layout>
      <SEO
        title="FAQ - Frequently Asked Questions"
        description="Frequently asked questions about PickUsAWinner. How we pick winners, pricing, scheduling, and more."
        url="/faq"
        keywords="pickusawinner faq, giveaway picker questions, instagram giveaway faq, random winner selection"
        structuredData={faqStructuredData}
      />
      <div className="max-w-3xl mx-auto py-16 px-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase italic mb-6">
          FAQ
        </h1>
        <p className="text-xl font-bold text-muted-foreground mb-12">
          Common questions about PickUsAWinner and our giveaway tools.
        </p>

        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-4 border-black bg-white px-4 sm:px-6 data-[state=open]:bg-slate-50"
            >
              <AccordionTrigger className="font-black uppercase text-left hover:no-underline py-6">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-700 font-medium pb-6">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors"
          >
            How It Works <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/tool"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
          >
            Try Instagram Picker <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}

