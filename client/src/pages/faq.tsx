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
    q: "How does PickUsAWinner pick winners?",
    a: "We use secure random number generation (the same kind used for banking and encryption) to make sure every entry has an equal chance. For Instagram giveaways, we also let you filter by hashtags, emojis, mentions, and automatically remove duplicate or fake entries.",
  },
  {
    q: "Do I need to sign up?",
    a: "Nope. No signup, no login needed. The wheel, name picker, and option picker are totally free. For Instagram comment picking, there's a one-time £2.50 payment — no subscriptions.",
  },
  {
    q: "Can I schedule giveaways?",
    a: "Yes! You can set a date and time, and we'll automatically run the giveaway for you. You'll get an email with the results when it's done.",
  },
  {
    q: "What tools do you have?",
    a: "We have four tools: (1) Instagram Comment Picker for giveaways, (2) Spin the Wheel with a fun animation, (3) Random Name Picker for drawing names from a list, and (4) Random Option Picker for when you can't decide. All free except Instagram comment fetching.",
  },
  {
    q: "Is the picking actually fair?",
    a: "Yes, 100%. We use the same type of secure randomness that banks use — not the basic random that most websites use. Everyone has an equal chance, and we explain exactly how it works on our How It Works page.",
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
          Got questions? Here are the ones we get asked the most.
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

