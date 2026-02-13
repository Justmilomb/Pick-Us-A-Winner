import { Link } from "wouter";
import { ArrowRight, Instagram, Youtube, Facebook, Twitter, Hash, Shuffle } from "lucide-react";

interface ToolLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ALL_TOOLS: ToolLink[] = [
  { href: "/tool", label: "Instagram Picker", icon: <Instagram className="w-5 h-5" /> },
  { href: "/instagram-comment-scraper", label: "Comment Scraper", icon: <Shuffle className="w-5 h-5" /> },
  { href: "/youtube", label: "YouTube Picker", icon: <Youtube className="w-5 h-5" /> },
  { href: "/tiktok", label: "TikTok Picker", icon: <Hash className="w-5 h-5" /> },
  { href: "/facebook-picker", label: "Facebook Picker", icon: <Facebook className="w-5 h-5" /> },
  { href: "/twitter-picker", label: "Twitter Picker", icon: <Twitter className="w-5 h-5" /> },
  { href: "/wheel", label: "Wheel of Names", icon: <Shuffle className="w-5 h-5" /> },
  { href: "/picker", label: "Random Name Picker", icon: <Shuffle className="w-5 h-5" /> },
];

interface RelatedToolsProps {
  /** Current page path to exclude from suggestions */
  excludePath?: string;
  /** Max number of tools to show (default 3) */
  max?: number;
  className?: string;
}

export function RelatedTools({ excludePath, max = 3, className = "" }: RelatedToolsProps) {
  const tools = ALL_TOOLS.filter((t) => t.href !== excludePath).slice(0, max);

  return (
    <section className={`space-y-4 ${className}`}>
      <h3 className="text-xl font-black uppercase tracking-wider">Related Tools</h3>
      <div className="flex flex-wrap gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white font-bold hover:bg-black hover:text-white transition-colors shadow-neo-sm"
          >
            {tool.icon}
            {tool.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ))}
      </div>
    </section>
  );
}
