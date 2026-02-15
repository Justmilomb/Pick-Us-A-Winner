import { Link, useLocation } from "wouter";
import { Gift, Menu, Instagram, Youtube, Twitter, Sparkles, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const navLinks = [
    { href: "/giveaway-generator", label: "Home" },
    { href: "/tool", label: "Instagram Picker" },
    { href: "/spin-the-wheel", label: "Spin the Wheel" },
    { href: "/random-name-picker", label: "Name Picker" },
    { href: "/press", label: "Media Kit" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-accent selection:text-white">
      {/* Neo-Brutalist Navbar */}
      <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          <Link href="/giveaway-generator" className="flex items-center gap-2 group">
            <div className="bg-primary p-2 border-2 border-black group-hover:rotate-12 transition-transform shadow-neo-sm">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-2xl md:text-3xl tracking-tight uppercase italic leading-none">
                <span className="text-primary">Pick</span>
                <span className="mx-1">Us</span>
                <span className="text-primary mx-1">A</span>
                <span>Winner</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mt-1 hidden sm:block">
                #1 Winner Picker
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-black uppercase text-sm tracking-wider transition-all hover:text-primary",
                  location === link.href ? "underline decoration-4 underline-offset-8 text-primary" : "text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Buttons Removed */}

            <Link href="/tool" className="neo-btn-primary py-2 px-6 text-sm flex items-center gap-2 group bg-primary text-white border-black">
              Launch App <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </Link>
          </nav>

          {/* Mobile Nav Toggle */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden touch-target p-2 border-4 border-black hover:bg-black hover:text-white transition-colors bg-white shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                <Menu className="w-8 h-8" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] border-l-4 border-black p-0 overflow-hidden">
              <div className="flex flex-col h-full bg-secondary">
                <div className="p-8 border-b-4 border-black bg-white flex items-center justify-between">
                  <span className="font-display font-black text-3xl uppercase italic">Menu</span>
                  <button onClick={() => setIsOpen(false)} className="border-4 border-black p-2 font-black">X</button>
                </div>
                <nav className="flex flex-col gap-6 p-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-3xl font-black border-4 border-black p-6 shadow-neo transition-all flex justify-between items-center group",
                        location === link.href ? "bg-primary text-white" : "bg-white text-black"
                      )}
                    >
                      {link.label}
                      <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  ))}

                  {/* Mobile Auth Links Removed */}

                  <Link
                    href="/tool"
                    onClick={() => setIsOpen(false)}
                    className="text-3xl font-black border-4 border-black bg-accent text-white p-6 shadow-neo transition-all flex justify-between items-center group"
                  >
                    Launch App
                    <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                  </Link>
                </nav>

                <div className="mt-auto p-8 border-t-4 border-black bg-white">
                  <p className="font-black uppercase tracking-widest text-sm mb-4">Supported Platforms</p>
                  <div className="flex gap-4">
                    <span className="p-4 border-4 border-black bg-instagram text-white shadow-neo-sm font-black italic">IG</span>
                    <span className="p-4 border-4 border-black bg-slate-200 text-slate-500 shadow-neo-sm font-black italic opacity-50">YT</span>
                    <span className="p-4 border-4 border-black bg-slate-200 text-slate-500 shadow-neo-sm font-black italic opacity-50">TK</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-8 md:py-12">
        {children}
      </main>

      <footer className="border-t-4 border-black bg-white mt-auto overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-4 space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-black p-2 border-2 border-white">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <span className="font-display font-black text-3xl md:text-4xl uppercase italic tracking-tight"><span className="text-primary">Pick</span> <span>Us</span> <span className="text-primary">A</span> <span>Winner</span></span>
              </div>
              <p className="text-lg font-bold leading-relaxed max-w-md">
                The simplest random selection toolkit on the web. Instagram giveaway picker, spin the wheel, random name picker & more. Trusted by creators worldwide.
              </p>
            </div>

            <div className="md:col-span-4 space-y-6">
              <h4 className="font-black text-xl uppercase tracking-widest border-b-4 border-primary pb-2 inline-block">Tools</h4>
              <ul className="space-y-3 font-bold text-base">
                <li><Link href="/tool" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> Instagram Picker</Link></li>
                <li><Link href="/spin-the-wheel" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> Spin the Wheel</Link></li>
                <li><Link href="/random-name-picker" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> Random Name Picker</Link></li>
                <li><Link href="/random-option-picker" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> Random Option Picker</Link></li>
                <li><Link href="/giveaway-generator" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> Giveaway Generator</Link></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-6">
              <h4 className="font-black text-xl uppercase tracking-widest border-b-4 border-primary pb-2 inline-block">Resources</h4>
              <ul className="space-y-3 font-bold text-base">
                <li><Link href="/how-it-works" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> How It Works</Link></li>
                <li><Link href="/faq" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> FAQ</Link></li>
                <li><Link href="/instagram-giveaway-guide" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> Instagram Giveaway Guide</Link></li>
                <li><Link href="/coming-soon" className="hover:text-primary transition-colors flex items-center gap-2 group opacity-60"><div className="w-2 h-2 bg-black group-hover:bg-primary" /> YouTube, TikTok, Facebook (Soon)</Link></li>
              </ul>
            </div>
          </div>

          {/* Trustpilot */}
          <div className="mt-10 flex justify-center">
            <div className="trustpilot-widget" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="698f4179cd2640ab9bfcee91" data-style-height="52px" data-style-width="100%" data-token="c36af70c-349b-4644-b258-8f7e234df2de">
              <a href="https://www.trustpilot.com/review/pickusawinner.com" target="_blank" rel="noopener">Trustpilot</a>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="font-black uppercase tracking-widest text-sm text-center md:text-left">© 2026 PickUsAWinner. All rights reserved.</p>
            <div className="flex gap-8 font-black uppercase tracking-widest text-[10px] md:text-xs">
              <Link href="/press" className="hover:underline underline-offset-4">Press</Link>
              <Link href="/contact" className="hover:underline underline-offset-4">Contact</Link>
              <Link href="/privacy" className="hover:underline underline-offset-4">Privacy Policy</Link>
              <Link href="/terms" className="hover:underline underline-offset-4">Terms of Service</Link>
              <span className="text-muted-foreground">Certified Random</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple ArrowRight icon helper if not imported
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}