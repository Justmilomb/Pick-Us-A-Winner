import Layout from "@/components/layout";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, Plus, Trash2, PartyPopper, Volume2, VolumeX } from "lucide-react";
import { Link } from "wouter";

const COLORS = [
  "#E1306C", "#833AB4", "#FCAF45", "#405DE6",
  "#FF338D", "#00C853", "#FF6D00", "#2979FF",
  "#D500F9", "#00E5FF", "#FFD600", "#F50057",
];

const defaultEntries = ["Winner 1", "Winner 2", "Winner 3", "Winner 4", "Winner 5", "Winner 6"];

export default function SpinTheWheel() {
  const [entries, setEntries] = useState<string[]>(defaultEntries);
  const [newEntry, setNewEntry] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addEntry = useCallback(() => {
    const trimmed = newEntry.trim();
    if (trimmed && entries.length < 50) {
      setEntries(prev => [...prev, trimmed]);
      setNewEntry("");
    }
  }, [newEntry, entries.length]);

  const removeEntry = useCallback((index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    setWinner(null);
  }, []);

  const spin = useCallback(() => {
    if (entries.length < 2 || spinning) return;

    setSpinning(true);
    setWinner(null);

    // Cryptographically random spin
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const randomFraction = array[0] / (0xFFFFFFFF + 1);

    const segmentAngle = 360 / entries.length;
    const targetIndex = Math.floor(randomFraction * entries.length);
    // Pointer at top (12 o'clock). Segment center at -90 + (i+0.5)*segmentAngle. Align: rotation = 90 - (i+0.5)*segmentAngle
    const targetAngle = (90 - (targetIndex + 0.5) * segmentAngle - (rotation + 1800) % 360 + 360) % 360;
    const totalRotation = rotation + 1800 + targetAngle + Math.random() * 20 - 10;

    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinner(entries[targetIndex]);
    }, 4000);
  }, [entries, spinning, rotation]);

  const segmentAngle = entries.length > 0 ? 360 / entries.length : 360;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Spin the Wheel - Free Online Wheel Spinner",
    "description": "Free online spin the wheel tool. Add names, options, or prizes and spin to pick a random winner. Cryptographically fair random selection. No signup required.",
    "url": "https://giveaway-engine.com/spin-the-wheel",
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
        "name": "Is the spin the wheel tool free?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, our spin the wheel tool is 100% free to use with no signup required. Add your entries and spin instantly." }
      },
      {
        "@type": "Question",
        "name": "Is the random wheel spinner fair?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, we use the Web Crypto API (crypto.getRandomValues) for cryptographically secure random number generation. Every segment has an equal chance of being selected." }
      },
      {
        "@type": "Question",
        "name": "How many entries can I add to the wheel?",
        "acceptedAnswer": { "@type": "Answer", "text": "You can add up to 50 entries to the wheel. Each entry gets an equal-sized segment and equal probability of being selected." }
      },
      {
        "@type": "Question",
        "name": "Can I use this for giveaways?",
        "acceptedAnswer": { "@type": "Answer", "text": "Absolutely! Our spin the wheel is perfect for giveaways, raffles, classroom activities, team decisions, and any situation where you need a fair random selection. For Instagram giveaways specifically, try our Instagram Comment Picker tool." }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Spin the Wheel - Free Online Random Wheel Spinner"
        description="Free online spin the wheel tool. Add names, options, or prizes and spin to pick a random winner. Cryptographically fair random selection. Perfect for giveaways, raffles, classrooms & decisions. No signup required."
        keywords="spin the wheel, random wheel, wheel spinner, spin wheel online, prize wheel, wheel of names, random spinner, wheel picker, spin to win, random wheel spinner, online wheel spinner, free wheel spinner, spin the wheel picker, random name wheel, giveaway wheel spinner"
        url="/spin-the-wheel"
        structuredData={structuredData}
      />
      <div className="space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter">
            Spin <span className="text-primary">The Wheel</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-700 max-w-3xl mx-auto">
            Add your entries and spin for a cryptographically fair random result. Perfect for giveaways, raffles, classroom picks, and team decisions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Wheel */}
          <div className="relative flex flex-col items-center gap-6">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[16px] border-r-[16px] border-t-[32px] border-l-transparent border-r-transparent border-t-black" />

            <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]">
              <motion.div
                className="w-full h-full"
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                  <circle cx="200" cy="200" r="198" fill="white" stroke="black" strokeWidth="4" />
                  {entries.map((entry, i) => {
                    const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
                    const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
                    const x1 = 200 + 196 * Math.cos(startAngle);
                    const y1 = 200 + 196 * Math.sin(startAngle);
                    const x2 = 200 + 196 * Math.cos(endAngle);
                    const y2 = 200 + 196 * Math.sin(endAngle);
                    const largeArc = segmentAngle > 180 ? 1 : 0;
                    const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
                    const textX = 200 + 130 * Math.cos(midAngle);
                    const textY = 200 + 130 * Math.sin(midAngle);
                    const textRotation = (i + 0.5) * segmentAngle;

                    return (
                      <g key={i}>
                        <path
                          d={`M200,200 L${x1},${y1} A196,196 0 ${largeArc},1 ${x2},${y2} Z`}
                          fill={COLORS[i % COLORS.length]}
                          stroke="black"
                          strokeWidth="2"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill="white"
                          fontWeight="900"
                          fontSize={entries.length > 12 ? "10" : entries.length > 8 ? "12" : "14"}
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                          style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                        >
                          {entry.length > 12 ? entry.slice(0, 10) + ".." : entry}
                        </text>
                      </g>
                    );
                  })}
                  {entries.length === 0 && (
                    <text x="200" y="200" fill="#999" fontWeight="bold" fontSize="16" textAnchor="middle" dominantBaseline="central">
                      Add entries to spin
                    </text>
                  )}
                  <circle cx="200" cy="200" r="24" fill="white" stroke="black" strokeWidth="4" />
                </svg>
              </motion.div>
            </div>

            <Button
              onClick={spin}
              disabled={entries.length < 2 || spinning}
              className="neo-btn-primary text-xl sm:text-2xl py-6 px-10"
            >
              {spinning ? "Spinning..." : "SPIN!"}
            </Button>

            {/* Winner Display */}
            {winner && !spinning && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="bg-secondary border-4 border-black p-6 shadow-neo text-center w-full max-w-sm"
              >
                <PartyPopper className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-600">Winner</p>
                <p className="text-3xl sm:text-4xl font-black uppercase">{winner}</p>
              </motion.div>
            )}
          </div>

          {/* Entry Management */}
          <div className="space-y-4">
            <div className="border-4 border-black bg-white p-6 shadow-neo space-y-4">
              <h2 className="text-2xl font-black uppercase">Entries ({entries.length}/50)</h2>

              <div className="flex gap-2">
                <Input
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEntry()}
                  placeholder="Add a name or option..."
                  className="neo-input flex-1"
                  maxLength={50}
                />
                <Button onClick={addEntry} className="neo-btn-primary" disabled={!newEntry.trim()}>
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {entries.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 border-2 border-black p-3 group">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-bold">{entry}</span>
                    </div>
                    <button
                      onClick={() => removeEntry(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={clearAll} variant="outline" className="border-2 border-black font-bold flex-1 gap-2">
                  <Trash2 className="w-4 h-4" /> Clear All
                </Button>
                <Button onClick={() => { setWinner(null); setRotation(0); }} variant="outline" className="border-2 border-black font-bold flex-1 gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="border-4 border-black bg-white p-6 shadow-neo space-y-3">
              <h3 className="text-lg font-black uppercase">More Random Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link href="/tool" className="neo-btn-primary text-center text-sm py-3">Instagram Picker</Link>
                <Link href="/random-name-picker" className="neo-btn-secondary text-center text-sm py-3">Name Picker</Link>
                <Link href="/random-option-picker" className="neo-btn-secondary text-center text-sm py-3">Option Picker</Link>
                <Link href="/how-it-works" className="border-2 border-black p-3 font-bold text-center text-sm hover:bg-gray-50 transition-colors">How It Works</Link>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content Section */}
        <section className="border-4 border-black bg-white p-8 shadow-neo space-y-8 mt-12">
          <h2 className="text-3xl sm:text-4xl font-black uppercase">Free Online Spin the Wheel Tool</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase">How Our Wheel Spinner Works</h3>
              <p className="font-medium text-slate-700 leading-relaxed">
                Our spin the wheel tool uses the <strong>Web Crypto API</strong> for cryptographically secure random number generation.
                Unlike tools that use <code>Math.random()</code>, our wheel spinner guarantees true randomness that cannot be predicted or manipulated.
                Every segment has an exactly equal probability of being selected.
              </p>
              <p className="font-medium text-slate-700 leading-relaxed">
                Simply add your entries — names, prizes, options, or anything else — and hit spin. The wheel will animate
                and land on a truly random selection. Perfect for <strong>giveaways</strong>, <strong>classroom activities</strong>,
                <strong>team decisions</strong>, <strong>raffle drawings</strong>, and <strong>party games</strong>.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-black uppercase">Why Choose Our Random Wheel?</h3>
              <ul className="space-y-3">
                {[
                  "Cryptographically secure randomness (Web Crypto API)",
                  "No signup or login required",
                  "No data stored — your entries stay private",
                  "Works on all devices — mobile, tablet, desktop",
                  "Up to 50 entries per wheel",
                  "Instant results with smooth animation",
                  "100% free with no hidden fees",
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

        {/* FAQ Section */}
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

        {/* Additional structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      </div>
    </Layout>
  );
}
