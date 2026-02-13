import Layout from "@/components/layout";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dice5, Plus, Trash2, RotateCcw, Sparkles } from "lucide-react";
import { Link } from "wouter";

const OPTION_COLORS = [
  "bg-[#E1306C]", "bg-[#833AB4]", "bg-[#FCAF45]", "bg-[#405DE6]",
  "bg-[#FF338D]", "bg-[#00C853]", "bg-[#FF6D00]", "bg-[#2979FF]",
  "bg-[#D500F9]", "bg-[#00E5FF]",
];

const defaultOptions = ["Option A", "Option B", "Option C", "Option D"];

export default function RandomOptionPicker() {
  const [options, setOptions] = useState<string[]>(defaultOptions);
  const [newOption, setNewOption] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const addOption = useCallback(() => {
    const trimmed = newOption.trim();
    if (trimmed && options.length < 30) {
      setOptions(prev => [...prev, trimmed]);
      setNewOption("");
    }
  }, [newOption, options.length]);

  const removeOption = useCallback((index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const pickRandom = useCallback(() => {
    if (options.length < 2 || isAnimating) return;

    setIsAnimating(true);
    setResult(null);

    // Animate through options rapidly
    let animationCount = 0;
    const maxAnimations = 25;
    const interval = setInterval(() => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      setHighlightIndex(array[0] % options.length);
      animationCount++;

      if (animationCount >= maxAnimations) {
        clearInterval(interval);

        // Cryptographically random final pick
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        const winnerIndex = arr[0] % options.length;
        setHighlightIndex(winnerIndex);
        setResult(options[winnerIndex]);
        setIsAnimating(false);
      }
    }, 100);
  }, [options, isAnimating]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Random Option Picker - Random Choice Maker",
    "description": "Free random option picker and decision maker. Enter your choices and let our cryptographically fair tool pick for you. Perfect for making decisions, picking restaurants, choosing activities, and more.",
    "url": "https://giveaway-engine.com/random-option-picker",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web Browser",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "author": { "@type": "Organization", "name": "PickUsAWinner" }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the random option picker work?",
        "acceptedAnswer": { "@type": "Answer", "text": "Our random option picker uses the Web Crypto API (crypto.getRandomValues) to generate cryptographically secure random numbers. Each option has an exactly equal probability of being selected, making the choice completely fair and unbiased." }
      },
      {
        "@type": "Question",
        "name": "What can I use this random choice maker for?",
        "acceptedAnswer": { "@type": "Answer", "text": "You can use it for any decision: picking a restaurant, choosing what movie to watch, selecting a random task, deciding who goes first in a game, picking a random activity, choosing between gift ideas, and much more." }
      },
      {
        "@type": "Question",
        "name": "Is it free to use?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, completely free with no signup required. Your options are processed locally in your browser and never sent to any server." }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Random Option Picker - Free Online Random Choice Maker"
        description="Free random option picker and decision maker. Enter your choices and let our cryptographically fair tool pick for you. Perfect for making decisions, picking restaurants, choosing activities. No signup required."
        keywords="random option picker, random choice maker, decision maker, random selector, random picker, pick random option, decision wheel, random chooser, what should I do, random decision maker, choice randomizer, option randomizer, pick for me, random item picker"
        url="/random-option-picker"
        structuredData={structuredData}
      />
      <div className="space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter">
            Random <span className="text-primary">Option Picker</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-700 max-w-3xl mx-auto">
            Can't decide? Enter your options and let cryptographically fair randomness choose for you. Fast, free, and private.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Options Grid */}
          <div className="space-y-4">
            <div className="border-4 border-black bg-white p-6 shadow-neo space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                  <Dice5 className="w-6 h-6" /> Options ({options.length}/30)
                </h2>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                  placeholder="Add an option..."
                  className="neo-input flex-1"
                  maxLength={60}
                />
                <Button onClick={addOption} className="neo-btn-primary" disabled={!newOption.trim()}>
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {options.map((option, i) => (
                  <motion.div
                    key={`${option}-${i}`}
                    animate={{
                      scale: highlightIndex === i ? 1.05 : 1,
                      borderColor: highlightIndex === i ? "#E1306C" : "#000",
                    }}
                    className={`flex items-center justify-between border-2 border-black p-3 group transition-colors ${
                      result === option && highlightIndex === i
                        ? "bg-secondary border-primary"
                        : highlightIndex === i
                        ? "bg-primary/10"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-3 h-3 border border-black flex-shrink-0 ${OPTION_COLORS[i % OPTION_COLORS.length]}`} />
                      <span className="font-bold truncate">{option}</span>
                    </div>
                    <button
                      onClick={() => removeOption(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={pickRandom}
                  disabled={options.length < 2 || isAnimating}
                  className="neo-btn-primary flex-1 text-lg py-5 gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {isAnimating ? "Choosing..." : "Pick Random Option"}
                </Button>
                <Button
                  onClick={() => { setOptions([]); setResult(null); setHighlightIndex(null); }}
                  variant="outline"
                  className="border-2 border-black font-bold"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div className="space-y-4">
            <div className="border-4 border-black bg-primary text-white p-10 shadow-neo text-center min-h-[200px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {result && !isAnimating ? (
                  <motion.div
                    key="result"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="space-y-3"
                  >
                    <Sparkles className="w-12 h-12 mx-auto" />
                    <p className="text-sm font-black uppercase tracking-widest opacity-80">The Choice Is</p>
                    <p className="text-4xl sm:text-5xl font-black uppercase">{result}</p>
                  </motion.div>
                ) : isAnimating ? (
                  <motion.p
                    key="animating"
                    className="text-3xl font-black animate-pulse"
                  >
                    Choosing...
                  </motion.p>
                ) : (
                  <p key="ready" className="text-2xl font-black opacity-60 uppercase">
                    Add options & pick
                  </p>
                )}
              </AnimatePresence>
            </div>

            {result && !isAnimating && (
              <Button onClick={pickRandom} className="neo-btn-secondary w-full gap-2 text-lg py-5">
                <RotateCcw className="w-5 h-5" /> Pick Again
              </Button>
            )}

            {/* Quick Tools */}
            <div className="border-4 border-black bg-white p-6 shadow-neo space-y-3">
              <h3 className="text-lg font-black uppercase">More Random Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link href="/tool" className="neo-btn-primary text-center text-sm py-3">Instagram Picker</Link>
                <Link href="/spin-the-wheel" className="neo-btn-secondary text-center text-sm py-3">Spin the Wheel</Link>
                <Link href="/random-name-picker" className="neo-btn-secondary text-center text-sm py-3">Name Picker</Link>
                <Link href="/how-it-works" className="border-2 border-black p-3 font-bold text-center text-sm hover:bg-gray-50 transition-colors">How It Works</Link>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-8 mt-12">
          <h2 className="text-3xl sm:text-4xl font-black uppercase">Free Random Option Picker & Decision Maker</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase">Let Randomness Decide</h3>
              <p className="font-medium text-slate-700 leading-relaxed">
                Can't decide between multiple options? Our random option picker eliminates decision fatigue by making
                a <strong>cryptographically fair choice</strong> for you. Powered by the <strong>Web Crypto API</strong>,
                each option has a mathematically equal probability of being selected.
              </p>
              <p className="font-medium text-slate-700 leading-relaxed">
                Whether you're picking a restaurant, choosing a movie, deciding on a gift, or settling a friendly debate,
                our tool makes the choice instantly and fairly. No signup, no downloads, no data collected.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase">Popular Uses</h3>
              <ul className="space-y-3">
                {[
                  "Where to eat — pick a random restaurant",
                  "What to watch — choose a random movie or show",
                  "Game decisions — who goes first, what to play",
                  "Gift ideas — randomly select from a list",
                  "Daily activities — let chance pick your workout",
                  "Team assignments — randomly distribute tasks",
                  "Travel destinations — pick your next adventure",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 font-medium text-slate-700">
                    <span className="bg-primary text-white px-1.5 py-0.5 text-xs font-black border border-black mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6 mt-8">
          <h2 className="text-3xl font-black uppercase text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
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
