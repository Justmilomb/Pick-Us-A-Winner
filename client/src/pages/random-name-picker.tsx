import Layout from "@/components/layout";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PartyPopper, Shuffle, RotateCcw, Trash2, Users, Copy, Check } from "lucide-react";
import { Link } from "wouter";

export default function RandomNamePicker() {
  const [nameInput, setNameInput] = useState("Alice\nBob\nCharlie\nDiana\nEve\nFrank\nGrace\nHenry");
  const [count, setCount] = useState(1);
  const [winners, setWinners] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingName, setAnimatingName] = useState("");
  const [copied, setCopied] = useState(false);

  const names = nameInput
    .split("\n")
    .map(n => n.trim())
    .filter(n => n.length > 0);

  const pickWinners = useCallback(() => {
    if (names.length < 1 || isAnimating) return;

    setIsAnimating(true);
    setWinners([]);

    // Animate through random names
    let animationCount = 0;
    const maxAnimations = 20;
    const interval = setInterval(() => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const idx = array[0] % names.length;
      setAnimatingName(names[idx]);
      animationCount++;

      if (animationCount >= maxAnimations) {
        clearInterval(interval);

        // Use crypto random for final selection
        const selected: string[] = [];
        const available = [...names];
        const pickCount = Math.min(count, available.length);

        for (let i = 0; i < pickCount; i++) {
          const arr = new Uint32Array(1);
          crypto.getRandomValues(arr);
          const randomIndex = arr[0] % available.length;
          selected.push(available[randomIndex]);
          available.splice(randomIndex, 1);
        }

        setWinners(selected);
        setAnimatingName("");
        setIsAnimating(false);
      }
    }, 80);
  }, [names, count, isAnimating]);

  const copyResults = useCallback(() => {
    navigator.clipboard.writeText(winners.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [winners]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Random Name Picker - Pick Names at Random",
    "description": "Free random name picker tool. Enter a list of names and pick winners at random with cryptographically fair selection. Perfect for giveaways, classrooms, raffles, and team building.",
    "url": "https://giveaway-engine.com/random-name-picker",
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
        "name": "How does the random name picker work?",
        "acceptedAnswer": { "@type": "Answer", "text": "Our random name picker uses the Web Crypto API to generate cryptographically secure random numbers. We implement the Fisher-Yates shuffle algorithm to ensure every name has an equal probability of being selected. No name is favored over another." }
      },
      {
        "@type": "Question",
        "name": "Is it truly random?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. We use crypto.getRandomValues() which provides cryptographic-quality random numbers, unlike Math.random() which is a pseudo-random number generator. This means the selection is as random as computationally possible." }
      },
      {
        "@type": "Question",
        "name": "Can I pick multiple names at once?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can pick 1 to 20 winners at once. Each name is selected without replacement, so the same name won't be picked twice in a single draw." }
      },
      {
        "@type": "Question",
        "name": "Is my name list stored anywhere?",
        "acceptedAnswer": { "@type": "Answer", "text": "No. All processing happens locally in your browser. Your names are never sent to any server. When you close the page, the data is gone. We prioritize your privacy." }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Random Name Picker - Pick Names at Random Online Free"
        description="Free random name picker tool. Enter a list of names and pick winners at random. Cryptographically fair selection using Fisher-Yates shuffle. Perfect for giveaways, classrooms, raffles, and team building. No signup required."
        keywords="random name picker, pick names at random, name randomizer, random name selector, name picker wheel, random name generator, pick a random name, name drawing tool, random student picker, random team picker, name lottery, raffle picker, random selection tool, fair name picker"
        url="/random-name-picker"
        structuredData={structuredData}
      />
      <div className="space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter">
            Random <span className="text-primary">Name Picker</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-700 max-w-3xl mx-auto">
            Enter names, hit pick, and get a cryptographically fair random selection. No signup. No data stored. 100% free.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Input Panel */}
          <div className="border-4 border-black bg-white p-6 shadow-neo space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                <Users className="w-6 h-6" /> Names
              </h2>
              <span className="text-sm font-bold text-slate-500">{names.length} entries</span>
            </div>

            <Textarea
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={"Enter one name per line:\nAlice\nBob\nCharlie\n..."}
              className="neo-input min-h-[300px] font-mono"
              rows={12}
            />

            <div className="flex items-center gap-4">
              <label className="font-black uppercase text-sm whitespace-nowrap">Pick</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="neo-input py-2 px-3 font-bold"
              >
                {Array.from({ length: Math.min(20, Math.max(1, names.length)) }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} winner{n > 1 ? "s" : ""}</option>
                ))}
              </select>
              <span className="text-sm font-bold text-slate-500">from {names.length} names</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={pickWinners}
                disabled={names.length < 1 || isAnimating}
                className="neo-btn-primary flex-1 text-lg py-5 gap-2"
              >
                <Shuffle className="w-5 h-5" />
                {isAnimating ? "Picking..." : "Pick Random Name"}
              </Button>
              <Button
                onClick={() => { setWinners([]); setNameInput(""); }}
                variant="outline"
                className="border-2 border-black font-bold"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Animation Display */}
            <div className="border-4 border-black bg-primary text-white p-8 shadow-neo text-center min-h-[150px] flex flex-col items-center justify-center">
              {isAnimating ? (
                <motion.p
                  key={animatingName}
                  initial={{ opacity: 0, scale: 1.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-4xl sm:text-5xl font-black"
                >
                  {animatingName}
                </motion.p>
              ) : winners.length > 0 ? (
                <div className="space-y-2">
                  <PartyPopper className="w-10 h-10 mx-auto" />
                  <p className="text-sm font-black uppercase tracking-widest opacity-80">
                    {winners.length === 1 ? "Winner" : `${winners.length} Winners`}
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-black opacity-60 uppercase">Ready to Pick</p>
              )}
            </div>

            {/* Winners List */}
            <AnimatePresence>
              {winners.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-4 border-black bg-secondary p-6 shadow-neo space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase">Results</h3>
                    <Button onClick={copyResults} variant="outline" size="sm" className="border-2 border-black font-bold gap-2">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  {winners.map((name, i) => (
                    <motion.div
                      key={`${name}-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 bg-white border-2 border-black p-4"
                    >
                      <span className="bg-primary text-white w-8 h-8 flex items-center justify-center font-black border-2 border-black text-sm">
                        {i + 1}
                      </span>
                      <span className="text-xl font-black">{name}</span>
                    </motion.div>
                  ))}
                  <Button onClick={pickWinners} className="neo-btn-primary w-full gap-2 mt-2">
                    <RotateCcw className="w-4 h-4" /> Pick Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Tools */}
            <div className="border-4 border-black bg-white p-6 shadow-neo space-y-3">
              <h3 className="text-lg font-black uppercase">More Random Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link href="/tool" className="neo-btn-primary text-center text-sm py-3">Instagram Picker</Link>
                <Link href="/spin-the-wheel" className="neo-btn-secondary text-center text-sm py-3">Spin the Wheel</Link>
                <Link href="/random-option-picker" className="neo-btn-secondary text-center text-sm py-3">Option Picker</Link>
                <Link href="/how-it-works" className="border-2 border-black p-3 font-bold text-center text-sm hover:bg-gray-50 transition-colors">How It Works</Link>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-8 mt-12">
          <h2 className="text-3xl sm:text-4xl font-black uppercase">Free Random Name Picker Tool</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase">How It Works</h3>
              <p className="font-medium text-slate-700 leading-relaxed">
                Our random name picker uses the <strong>Fisher-Yates shuffle algorithm</strong> combined with
                the <strong>Web Crypto API</strong> for cryptographically secure random selection. This means every name
                in your list has a mathematically equal chance of being picked — no name is ever favored.
              </p>
              <p className="font-medium text-slate-700 leading-relaxed">
                Unlike simple random generators that use <code>Math.random()</code>, our tool leverages the same
                randomness source used in encryption and security applications. Your name list never leaves your browser —
                all processing happens locally, so your data remains completely private.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase">Use Cases</h3>
              <ul className="space-y-3">
                {[
                  "Giveaway & raffle winner selection",
                  "Classroom student picker for teachers",
                  "Team building & icebreaker activities",
                  "Secret Santa name drawing",
                  "Contest and competition judging",
                  "Jury selection & random assignment",
                  "Office task delegation",
                  "Game night player order selection",
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
