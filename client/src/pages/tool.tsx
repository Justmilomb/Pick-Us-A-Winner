import Layout from "@/components/layout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Search, Loader2, PartyPopper, RefreshCcw, Instagram, Users, Hash, AlertCircle, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import { WinnerCard } from "@/components/winner-card";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SEO } from "@/components/seo";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/checkout-form";
import { getStripe } from "@/lib/stripe";

import { useLocation } from "wouter";
import { parseApiError } from "@/lib/error-messages";

const stripeAppearance = {
  theme: "flat" as const,
  variables: {
    colorPrimary: "#000000",
    colorBackground: "#ffffff",
    colorText: "#000000",
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    fontSizeBase: "16px",
    spacingUnit: "8px",
    borderRadius: "0px",
    fontWeightNormal: "700",
  },
  rules: {
    ".Input": {
      border: "2px solid #000000",
      boxShadow: "3px 3px 0px 0px rgba(0,0,0,1)",
      padding: "12px",
    },
    ".Input:focus": {
      border: "2px solid #E1306C",
      boxShadow: "3px 3px 0px 0px rgba(225,48,108,1)",
    },
    ".Label": {
      fontWeight: "700",
      textTransform: "uppercase" as const,
    },
  },
};

// Entry type for comments
interface Entry {
  id: string;
  username: string;
  comment: string;
  mentionCount?: number;
  platform: "instagram";
  timestamp?: string;
  fraudScore?: number;
  userId?: string;
}

export default function GiveawayTool() {
  const [step, setStep] = useState<"input" | "fetching" | "options" | "payment" | "picking" | "results" | "scheduled">("input");

  // Input State
  const [url, setUrl] = useState("");
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);


  // Rules State
  const [winnerCount, setWinnerCount] = useState(1);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [minMentions, setMinMentions] = useState(1);
  const [requireMention, setRequireMention] = useState(false);
  const [excludeDuplicates, setExcludeDuplicates] = useState(true);
  const [blockList, setBlockList] = useState("");
  const [enableBonusChances, setEnableBonusChances] = useState(false);
  const [excludeFraud, setExcludeFraud] = useState(true);

  // Data State
  const [fetchedEntries, setFetchedEntries] = useState<Entry[]>([]);
  const [validEntries, setValidEntries] = useState<Entry[]>([]);
  const [winners, setWinners] = useState<Entry[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  // Auth & Schedule State
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [winnerEmails, setWinnerEmails] = useState<Record<string, string>>({});
  const [customTheme, setCustomTheme] = useState<"default" | "dark" | "pink" | "custom">("default");
  const [customColor, setCustomColor] = useState("#E1306C");
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [, setLocation] = useLocation(); // for redirect if needed
  const FETCH_MAX_SECONDS = 180;
  const [fetchTimer, setFetchTimer] = useState(FETCH_MAX_SECONDS);

  const [userGiveaways, setUserGiveaways] = useState<any[]>([]);

  const refreshGiveaways = () => {
    // Placeholder for future local storage or session based history
  };

  // Reset valid entries when rules change
  useEffect(() => {
    if (step === "options") {
      applyFilters();
    }
  }, [winnerCount, filterKeyword, minMentions, requireMention, excludeDuplicates, blockList, enableBonusChances, excludeFraud]);

  // Handle initial form submission - fetch comments first, then let user set rules and pay.
  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFetchError(null);

    // Validation
    if (!url.includes("instagram.com")) {
      toast({ title: "Invalid URL", description: "Please enter a valid Instagram Post URL", variant: "destructive" });
      return;
    }

    setStep("fetching");
    setFetchTimer(FETCH_MAX_SECONDS);

    const timerInterval = setInterval(() => {
      setFetchTimer(prev => Math.max(0, prev - 1));
    }, 1000);

    try {
      const response = await fetch("/api/instagram/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch comments");

      const entries = (data.entries || []).map((entry: any) => ({
        ...entry,
        fraudScore: entry.fraudScore || 0,
      }));

      setFetchedEntries(entries);
      setStep("options");

      const initialValid = filterEntries(entries, {
        keyword: "",
        mentions: 1,
        requireMention: false,
        duplicates: true,
        blockList: blockList,
        excludeFraud: excludeFraud,
      });
      setValidEntries(initialValid);

      toast({
        title: "Success!",
        description: `Loaded ${entries.length > 200 ? "200+" : entries.length} comments from Instagram`,
      });
    } catch (error) {
      console.error("Fetch error:", error);
      const friendly = parseApiError(error);
      setFetchError(friendly.description);
      setStep("input");
      toast({
        title: "Couldn't Fetch Comments",
        description: friendly.description,
        variant: "destructive",
      });
    } finally {
      clearInterval(timerInterval);
    }
  };

  // Step 1: Create a Stripe PaymentIntent and show card form
  const handleCreatePaymentIntent = async () => {
    setIsCreatingIntent(true);
    try {
      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");
      setClientSecret(data.clientSecret);
    } catch (error) {
      const friendly = parseApiError(error);
      toast({
        title: "Payment Setup Failed",
        description: friendly.description,
        variant: "destructive",
      });
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const selectWinners = (entries: Entry[]): Entry[] => {
    let selectedWinners: Entry[] = [];

    const shuffle = <T,>(array: T[]) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    if (enableBonusChances) {
      const weightedPool: Entry[] = [];
      entries.forEach(entry => {
        const mentionCount =
          typeof entry.mentionCount === "number"
            ? entry.mentionCount
            : (entry.comment?.match(/@([a-zA-Z0-9_.]+)/g) || []).length;
        const poolEntries = 1 + Math.max(0, mentionCount - minMentions);
        for (let i = 0; i < poolEntries; i++) {
          weightedPool.push(entry);
        }
      });

      const shuffled = shuffle(weightedPool);
      const seen = new Set<string>();
      for (const entry of shuffled) {
        if (!seen.has(entry.username) && selectedWinners.length < winnerCount) {
          seen.add(entry.username);
          selectedWinners.push(entry);
        }
      }
      return selectedWinners;
    }

    return shuffle(entries).slice(0, winnerCount);
  };

  // After Stripe confirms: schedule giveaway OR fetch comments and pick winners.
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsProcessingPayment(true);
    try {
      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || "Payment verification failed");

      const token = confirmData.paymentToken;
      setPaymentToken(token);

      // Scheduled flow does not require fetching comments in this step.
      if (scheduleDate) {
        await handleConfirmScheduleWithToken(token);
        return;
      }

      const currentValid = validEntries.length > 0
        ? validEntries
        : filterEntries(fetchedEntries, {
            keyword: filterKeyword,
            mentions: minMentions,
            requireMention,
            duplicates: excludeDuplicates,
            blockList,
            excludeFraud,
          });

      if (currentValid.length < winnerCount) {
        setStep("options");
        toast({
          title: "Not enough valid entries",
          description: `Only ${currentValid.length} entries matched your rules. Adjust filters and try again.`,
          variant: "destructive",
        });
        return;
      }

      setValidEntries(currentValid);
      toast({ title: "Payment Successful", description: "Picking winners..." });
      setStep("picking");
      setTimeout(() => {
        setWinners(selectWinners(currentValid));
        setStep("results");
      }, 3000);
    } catch (error) {
      console.error("Payment error:", error);
      const friendly = parseApiError(error);
      setFetchError(friendly.description);
      setStep(fetchedEntries.length > 0 ? "options" : "input");
      toast({
        title: "Payment Error",
        description: friendly.description,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
      setClientSecret(null);
    }
  };

  const filterEntries = (entries: Entry[], rules: { keyword: string, mentions: number, requireMention: boolean, duplicates: boolean, blockList: string, excludeFraud: boolean }) => {
    let filtered = [...entries];
    const seenUsers = new Set();
    const result = [];

    // Parse block list into a Set for fast lookup
    const blockedUsernames = new Set(
      rules.blockList
        .split('\n')
        .map(line => line.trim().toLowerCase().replace(/^@/, ''))
        .filter(username => username.length > 0)
    );

    for (const entry of filtered) {
      // 0. Fraud Detection Filter
      if (rules.excludeFraud && typeof entry.fraudScore === 'number' && entry.fraudScore > 20) {
        continue;
      }

      // 1. Block List Filter
      if (blockedUsernames.has(entry.username.toLowerCase())) {
        continue;
      }

      // 2. Keyword / Emoji Filter
      if (rules.keyword) {
        if (!entry.comment) {
          continue;
        }
        // Check if the keyword is purely emoji (no letters/digits)
        const isEmojiKeyword = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D\s]+$/u.test(rules.keyword) &&
                               !/[a-zA-Z0-9]/.test(rules.keyword);
        if (isEmojiKeyword) {
          // For emoji keywords, do a direct includes check (case-insensitive doesn't apply)
          if (!entry.comment.includes(rules.keyword.trim())) {
            continue;
          }
        } else {
          // For text/hashtag keywords, do case-insensitive match
          if (!entry.comment.toLowerCase().includes(rules.keyword.toLowerCase())) {
            continue;
          }
        }
      }

      // 3. Mentions Filter - count actual @username patterns, not just @ symbols
      if (rules.requireMention) {
        const mentionCount =
          typeof entry.mentionCount === "number"
            ? entry.mentionCount
            : (entry.comment?.match(/@([a-zA-Z0-9_.]+)/g) || []).length;
        if (mentionCount < rules.mentions) {
          continue;
        }
      }

      // 4. Duplicate Filter
      if (rules.duplicates) {
        if (seenUsers.has(entry.username)) {
          continue;
        }
        seenUsers.add(entry.username);
      }

      result.push(entry);
    }
    return result;
  };

  const applyFilters = () => {
    const valid = filterEntries(fetchedEntries, {
      keyword: filterKeyword,
      mentions: minMentions,
      requireMention: requireMention,
      duplicates: excludeDuplicates,
      blockList: blockList,
      excludeFraud: excludeFraud
    });
    setValidEntries(valid);
  };

  const handlePickWinners = () => {
    if (validEntries.length < winnerCount) {
      toast({ title: "Error", description: "Not enough valid entries for the number of winners!", variant: "destructive" });
      return;
    }

    setStep("picking");
    // Simulate picking delay
    setTimeout(async () => {
      setWinners(selectWinners(validEntries));
      setStep("results");
      // Follower check removed
    }, 3000);
  };

  const resetTool = () => {
    setStep("input");
    setWinners([]);
    // retain inputs for convenience
    setFetchedEntries([]);
    setValidEntries([]);
    setFetchError(null);
    setPaymentToken(null);
    setClientSecret(null);
  };

  const handleSetScheduleTime = () => {
    if (!scheduleDate) {
      toast({ title: "Date Required", description: "Please pick a date/time", variant: "destructive" });
      return;
    }

    // Validate 15-minute minimum
    const finalDate = new Date(scheduleDate);
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    finalDate.setHours(hours, minutes);

    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    if (finalDate < minTime) {
      toast({
        title: "Invalid Schedule Time",
        description: `Scheduled time must be at least 15 minutes from now. Minimum time: ${format(minTime, "MMM d, yyyy 'at' HH:mm")}`,
        variant: "destructive",
      });
      return;
    }

    setScheduleOpen(false);
  };

  const handleClearSchedule = () => {
    setScheduleDate(undefined);
    setScheduleTime("12:00");
    setScheduleEmail("");
    setIsScheduled(false);
    toast({ title: "Schedule Cleared", description: "You can now proceed with instant winner generation." });
  };

  const handleConfirmScheduleWithToken = async (paymentToken: string) => {
    if (!scheduleEmail || !scheduleEmail.includes("@")) {
      toast({ title: "Email Required", description: "Please enter a valid email to receive results.", variant: "destructive" });
      return;
    }

    // Combine date and time
    const finalDate = new Date(scheduleDate!);
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    finalDate.setHours(hours, minutes);

    // Validate 15-minute minimum
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    if (finalDate < minTime) {
      toast({
        title: "Invalid Schedule Time",
        description: `Scheduled time must be at least 15 minutes from now. Minimum time: ${format(minTime, "MMM d, yyyy 'at' HH:mm")}`,
        variant: "destructive",
      });
      return;
    }

    // Prepare config
    const config = {
      url: url,
      mode: "comments",
      winnerCount: winnerCount,
      keyword: filterKeyword,
      requireMention: requireMention,
      minMentions: requireMention ? minMentions : 0,
      duplicateCheck: excludeDuplicates,
      blockList: blockList,
      bonusChances: enableBonusChances,
      excludeFraud: excludeFraud,
    };

    const res = await fetch("/api/giveaways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "anonymous",
        scheduledFor: finalDate.toISOString(),
        config: { ...config, contactEmail: scheduleEmail },
        status: "pending",
        paymentToken,
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to schedule");
    }

    setIsScheduled(true);
    toast({ title: "Scheduled!", description: `Results will be sent to ${scheduleEmail}` });
    setStep("scheduled");
    refreshGiveaways();
  };

  return (
    <Layout>
      <SEO
        title="Instagram Giveaway Generator | No Signup, No Login"
        description="Instagram giveaways tool & comment picker. Pick random winners from Instagram comments. Free to configure. one-time payment (£2.50) for credits. No signup, no subscription. Filter, schedule, done."
        url="/tool"
        keywords="instagram giveaways tool, instagram giveaway tool, instagram giveaway generator, instagram comments picker, instagram comment picker tool, no login, no signup, one-time payment, random winner selector, instagram contest"
        additionalStructuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "PickUsAWinner Instagram Giveaway Generator",
            applicationCategory: "UtilitiesApplication",
            offers: { "@type": "Offer", price: "2.50", priceCurrency: "GBP" },
            description: "Instagram giveaways tool. Pick random winners from Instagram comments. Free to configure. one-time payment (£2.50) for credits. No signup, no subscription.",
            url: "https://pickusawinner.com/tool",
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How do I pick an Instagram giveaway winner?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Paste your Instagram post link, grab the comments, set your filters (hashtags, emojis, mentions), and hit Pick Winners. It's random and fair. No signup needed.",
                },
              },
              {
                "@type": "Question",
                name: "Is the Instagram giveaway generator free?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Free to set up. One-time £2.50 payment to fetch comments and pick winners. No subscription, no login needed.",
                },
              },
              {
                "@type": "Question",
                name: "Do I need to log in to use the Instagram giveaway picker?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. You can use the Instagram giveaway generator without signing up or logging in. Just paste your post URL and pick winners.",
                },
              },
            ],
          },
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 relative">
          {/* User header removed */}
          <div className="inline-flex items-center gap-2 bg-[#E1306C] text-white px-4 py-1 font-bold uppercase tracking-wider mb-4 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transform -rotate-2">
            <Instagram className="w-5 h-5" /> Instagram Giveaway Generator
          </div>
          <div className="bg-amber-100 border-2 border-amber-600 text-amber-900 px-4 py-2 mb-4 font-bold text-sm sm:text-base max-w-xl mx-auto">
            Free to set up. Just £2.50 (one-time) to grab comments and pick winners.
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase mb-4">Pick Winners</h1>
          <p className="text-base sm:text-lg font-medium text-muted-foreground px-4 sm:px-0">Pick random winners from Instagram comments. Paste a link, set your rules, and go. No signup needed.</p>
        </div>

        <div className="grid gap-8">
          <AnimatePresence mode="wait">
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="neo-box p-4 sm:p-8 md:p-12 bg-white"
              >
                <form onSubmit={handleFetch} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-lg sm:text-xl font-bold uppercase">Instagram Post URL</Label>
                    <Input
                      placeholder="https://www.instagram.com/p/DB1234567/"
                      className="neo-input text-lg"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Works with Posts and Reels.
                    </p>
                  </div>

                  <Button type="submit" className="w-full neo-btn-primary text-lg sm:text-xl py-4 sm:py-6 bg-[#E1306C] hover:bg-[#C13584] border-black text-white mt-4">
                    <Search className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
                    Fetch Comments
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "fetching" && (
              <motion.div
                key="fetching"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-12 sm:py-20 neo-box bg-white px-4"
              >
                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-[#E1306C] mb-4 sm:mb-6" />
                <h2 className="text-xl sm:text-2xl font-bold uppercase animate-pulse text-center">
                  Reading Comments...
                </h2>
                <div className="w-48 sm:w-64 h-3 sm:h-4 bg-muted border-2 border-black mt-4 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#E1306C]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5 }}
                  />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground font-medium mt-2">Connecting to Instagram...</p>
                <p className="text-xs sm:text-sm text-amber-600 font-bold mt-2">Posts with many comments may take 1–3 minutes. Please wait.</p>
                <div className="mt-4 text-lg font-bold text-black bg-yellow-200 px-6 py-2 border-2 border-black rounded">
                  ⏱️ Up to {Math.floor(fetchTimer / 60)}:{String(fetchTimer % 60).padStart(2, '0')} remaining
                </div>
              </motion.div>
            )}

            {step === "options" && (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="neo-box p-4 sm:p-6 md:p-8 bg-white"
              >
                <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between border-b-2 border-black pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold uppercase">Filter Entries</h2>
                  <div className="flex flex-col items-end">
                    <span className="text-xs sm:text-sm text-muted-foreground font-bold">Total Found</span>
                    <span className="text-lg sm:text-xl font-black">{fetchedEntries.length > 200 ? "200+" : fetchedEntries.length}</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {/* Winner Count */}
                  <div className="space-y-4">
                    <Label className="font-bold text-base sm:text-lg uppercase flex items-center gap-2">
                      <PartyPopper className="w-5 h-5" /> Winners
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[winnerCount]}
                        onValueChange={(v) => setWinnerCount(v[0])}
                        min={1}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-2xl font-black w-12 text-center bg-black text-white p-1">{winnerCount}</span>
                    </div>
                  </div>

                  {/* Comment Filters */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white border-2 border-slate-200">
                      <Label className="font-bold text-lg uppercase flex items-center gap-2 cursor-pointer" htmlFor="mention-switch">
                        <Users className="w-5 h-5" /> Require Mentions?
                      </Label>
                      <Switch
                        id="mention-switch"
                        checked={requireMention}
                        onCheckedChange={setRequireMention}
                        className="data-[state=checked]:bg-black border-2 border-black"
                      />
                    </div>

                    {requireMention && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pl-4 border-l-4 border-black space-y-2"
                      >
                        <Label className="font-bold text-sm uppercase">Minimum Friends Tagged</Label>
                        <Select value={minMentions.toString()} onValueChange={(v) => setMinMentions(parseInt(v))}>
                          <SelectTrigger className="neo-input">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Friend (@tag)</SelectItem>
                            <SelectItem value="2">2 Friends (@tag @tag)</SelectItem>
                            <SelectItem value="3">3 Friends</SelectItem>
                            <SelectItem value="4">4 Friends</SelectItem>
                            <SelectItem value="5">5 Friends</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="font-bold text-lg uppercase flex items-center gap-2">
                      <Hash className="w-5 h-5" /> Must Include Word / Emoji
                    </Label>
                    <Input
                      placeholder="e.g. #giveaway, ❤️, 😁, or any word"
                      className="neo-input"
                      value={filterKeyword}
                      onChange={(e) => setFilterKeyword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Filter by hashtag, emoji, or any text. Comments must contain this to be a valid entry.
                    </p>
                  </div>

                  {/* Bonus Chances Toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 border-2 border-yellow-300">
                      <div className="flex flex-col">
                        <Label className="font-bold text-lg uppercase cursor-pointer" htmlFor="bonus-switch">
                          <PartyPopper className="w-5 h-5 inline mr-2" /> Bonus Chances
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Extra entries for users who tag more friends
                        </p>
                      </div>
                      <Switch
                        id="bonus-switch"
                        checked={enableBonusChances}
                        onCheckedChange={setEnableBonusChances}
                        className="data-[state=checked]:bg-black border-2 border-black"
                      />
                    </div>
                    {enableBonusChances && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pl-4 border-l-4 border-yellow-400 space-y-2"
                      >
                        <p className="text-sm font-medium">
                          Each extra mention = +1 entry chance
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Example: User with 3 mentions gets 2 entries (1 base + 1 bonus)
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Fraud Detection Toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-300">
                      <div className="flex flex-col">
                        <Label className="font-bold text-lg uppercase cursor-pointer" htmlFor="fraud-switch">
                          <AlertCircle className="w-5 h-5 inline mr-2" /> Exclude Suspicious Entries?
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Remove entries that look like bots or spam
                        </p>
                      </div>
                      <Switch
                        id="fraud-switch"
                        checked={excludeFraud}
                        onCheckedChange={setExcludeFraud}
                        className="data-[state=checked]:bg-black border-2 border-black"
                      />
                    </div>
                  </div>

                  {/* Duplicate Toggle - Always Show */}
                  <div className="space-y-4 flex flex-col justify-end">
                    <div className="flex items-center justify-between p-4 bg-secondary border-2 border-black">
                      <Label className="font-bold text-lg uppercase cursor-pointer" htmlFor="dup-switch">
                        Exclude Duplicates?
                      </Label>
                      <Switch
                        id="dup-switch"
                        checked={excludeDuplicates}
                        onCheckedChange={setExcludeDuplicates}
                        className="data-[state=checked]:bg-black border-2 border-black"
                      />
                    </div>
                  </div>

                  {/* Block List */}
                  <div className="space-y-4 md:col-span-2">
                    <Label className="font-bold text-lg uppercase flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Block List (One username per line)
                    </Label>
                    <textarea
                      placeholder="username1&#10;username2&#10;@username3"
                      className="neo-input min-h-[100px] font-mono text-sm"
                      value={blockList}
                      onChange={(e) => setBlockList(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add usernames you want to exclude (with or without @)
                    </p>
                  </div>
                </div>

                <div className="border-t-2 border-black pt-6">
                  <div className="bg-accent text-white p-4 border-2 border-black mb-6 flex justify-between items-center shadow-[4px_4px_0px_0px_#000000]">
                    <span className="font-bold text-lg uppercase">Valid Candidates</span>
                    <span className="font-black text-3xl">{validEntries.length > 200 ? "200+" : validEntries.length}</span>
                  </div>

                  {/* Winning Emails Toggle Removed */}

                  <Button
                    onClick={() => setStep("payment")}
                    disabled={validEntries.length === 0}
                    className="w-full neo-btn-primary text-xl py-6 disabled:opacity-50 disabled:cursor-not-allowed bg-green-500 text-white hover:bg-green-600 border-green-700 mb-4"
                  >
                    <PartyPopper className="mr-2 w-6 h-6" />
                    {scheduleDate ? "Pay £2.50 & Schedule" : "Pay £2.50 & Pick Winners"}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-2 border-dashed border-black text-xl py-6 hover:bg-slate-100 disabled:opacity-100 disabled:bg-slate-100"
                    onClick={() => setScheduleOpen(true)}
                    disabled={isScheduled}
                  >
                    {scheduleDate
                      ? <><CheckCircle className="mr-2 w-6 h-6 text-green-600" /> {format(scheduleDate, "MMM d")} at {scheduleTime}</>
                      : <><CalendarIcon className="mr-2 w-6 h-6" /> Schedule Spin</>
                    }
                  </Button>
                </div>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`neo-box w-full max-w-full min-w-0 overflow-hidden ${scheduleDate ? 'p-4 sm:p-6 md:p-12 max-w-2xl' : 'p-4 sm:p-6 md:p-8 max-w-md'} bg-white mx-auto`}
              >
                {scheduleDate ? (
                  // Scheduled Payment View (Big Text)
                  <div className="space-y-6 sm:space-y-8 text-center">
                    <div className="space-y-4">
                      <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase leading-tight">
                        Confirm Schedule
                      </h2>
                      <p className="text-base sm:text-xl font-bold bg-yellow-300 inline-block px-2 border-2 border-black transform -rotate-1">
                        For {format(scheduleDate, "MMMM do")} at {scheduleTime}
                      </p>
                    </div>

                    <div className="bg-slate-50 border-4 border-black p-4 sm:p-6 md:p-8 space-y-6 text-left">
                      <div className="flex gap-3 sm:gap-4 items-start">
                        <div className="bg-black text-white p-2 rounded-full min-w-[2rem] h-8 flex items-center justify-center font-bold text-sm sm:text-base">1</div>
                        <div className="min-w-0">
                          <h3 className="font-black uppercase text-base sm:text-lg">Full Control</h3>
                          <p className="font-medium text-slate-600 text-sm sm:text-base">You can edit your giveaway options anytime up to <span className="font-bold text-black bg-yellow-200 px-1">15 minutes before</span> the scheduled time.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 sm:gap-4 items-start">
                        <div className="bg-black text-white p-2 rounded-full min-w-[2rem] h-8 flex items-center justify-center font-bold text-sm sm:text-base">2</div>
                        <div className="min-w-0">
                          <h3 className="font-black uppercase text-base sm:text-lg">Instant Delivery</h3>
                          <p className="font-medium text-slate-600 text-sm sm:text-base">We will email you a secure link to manage your giveaway and view winners instantly when they are picked.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto w-full">
                      <div className="space-y-2 text-left">
                        <Label className="font-black uppercase text-base sm:text-lg">Enter Your Email</Label>
                        <Input
                          placeholder="you@email.com"
                          value={scheduleEmail}
                          onChange={(e) => setScheduleEmail(e.target.value)}
                          className="neo-input text-base sm:text-lg md:text-xl py-4 sm:py-6"
                        />
                      </div>

                      <div className="pt-4 space-y-3">
                        {clientSecret ? (
                          <div className="w-full min-w-0 overflow-hidden">
                            <Elements
                              stripe={getStripe()}
                              options={{ clientSecret, appearance: stripeAppearance }}
                            >
                              <CheckoutForm
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => { setClientSecret(null); setStep("options"); }}
                              />
                            </Elements>
                          </div>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                if (!scheduleEmail || !scheduleEmail.includes("@")) {
                                  toast({ title: "Email Required", description: "Please enter a valid email", variant: "destructive" });
                                  return;
                                }
                                handleCreatePaymentIntent();
                              }}
                              disabled={isCreatingIntent || !scheduleEmail || !scheduleEmail.includes("@")}
                              className="w-full neo-btn-primary bg-[#E1306C] text-white text-base sm:text-lg md:text-xl py-5 sm:py-6 md:py-8"
                            >
                              {isCreatingIntent ? (
                                <>
                                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                "Pay £2.50 & Schedule"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleClearSchedule}
                              className="w-full border-2 border-slate-300 text-slate-600 hover:bg-slate-100 text-base sm:text-lg font-bold uppercase"
                            >
                              Clear Schedule
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" onClick={() => setStep("options")} className="text-base sm:text-lg font-bold uppercase">Base options</Button>
                  </div>
                ) : (
                  // Instant Payment View - fetch (no credits) or pick winners
                  <>
                    <div className="text-center mb-6 sm:mb-8">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                        <span className="text-xl sm:text-2xl">💷</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black uppercase mb-2">Pay to Continue</h2>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {fetchedEntries.length > 0 ? "one-time payment (£2.50) to pick winners" : "one-time payment (£2.50) to access Instagram comments"}
                      </p>
                    </div>

                    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                      <div className="flex justify-between items-center p-3 sm:p-4 border-2 border-black bg-slate-50">
                        <span className="font-bold uppercase text-sm sm:text-base">Giveaway Round</span>
                        <span className="font-black text-lg sm:text-xl">£2.50</span>
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-200 p-3 sm:p-4 rounded">
                        <p className="text-xs sm:text-sm font-medium text-blue-800">
                          ✓ Fetch all comments from your post<br />
                          ✓ Filter & pick random winners<br />
                          ✓ Share results with your audience
                        </p>
                      </div>
                    </div>

                    {clientSecret ? (
                      <div className="w-full min-w-0 overflow-hidden">
                        <Elements
                          stripe={getStripe()}
                          options={{ clientSecret, appearance: stripeAppearance }}
                        >
                          <CheckoutForm
                            onSuccess={handlePaymentSuccess}
                            onCancel={() => { setClientSecret(null); setStep("options"); }}
                          />
                        </Elements>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleCreatePaymentIntent}
                          disabled={isCreatingIntent}
                          className="w-full neo-btn-primary bg-[#E1306C] hover:bg-[#C13584] text-white text-base sm:text-lg md:text-xl py-5 sm:py-6"
                        >
                          {isCreatingIntent ? (
                            <>
                              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            fetchedEntries.length > 0 ? "Pay £2.50 & Pick Winners" : "Pay £2.50 & Fetch Comments"
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => setStep("options")}
                          className="w-full mt-2 text-base sm:text-lg font-bold uppercase"
                        >
                          Back to Options
                        </Button>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            )}




            {step === "picking" && (
              <motion.div
                key="picking"
                className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4"
              >
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="text-6xl sm:text-8xl mb-6 sm:mb-8"
                >
                  🎲
                </motion.div>
                <h2 className="text-2xl sm:text-4xl font-black uppercase text-primary mb-2">Rolling the Dice...</h2>
                <p className="text-base sm:text-xl font-medium text-muted-foreground">Ensuring fairness & randomness</p>
              </motion.div>
            )}

            {step === "scheduled" && (
              <motion.div
                key="scheduled"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="bg-green-100 p-6 rounded-full border-4 border-black">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-4xl md:text-5xl font-black uppercase">All Set!</h2>
                  <p className="text-xl font-medium text-slate-600 max-w-lg mx-auto">
                    Your giveaway is scheduled for <span className="font-bold text-black">{scheduleDate && format(scheduleDate, "MMMM do")} at {scheduleTime}</span>.
                  </p>
                </div>

                <div className="bg-slate-50 border-4 border-black p-8 max-w-xl w-full text-left space-y-4 shadow-[4px_4px_0px_0px_#000000]">
                  <h3 className="font-black uppercase text-xl border-b-2 border-slate-200 pb-2">What happens next?</h3>
                  <ul className="space-y-3 font-medium text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">1</span>
                      We've sent a confirmation email to <span className="font-bold text-black">{scheduleEmail}</span>.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">2</span>
                      The tool will automatically run at the scheduled time.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">3</span>
                      You'll receive another email with the link to view your winners!
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Button onClick={resetTool} variant="outline" className="border-2 border-black text-lg py-6 px-12 hover:bg-black hover:text-white transition-colors">
                    <RefreshCcw className="mr-2 w-5 h-5" /> Start Another Giveaway
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="text-center px-4">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase mb-2">🎉 Winners! 🎉</h2>
                  <p className="font-medium text-sm sm:text-lg text-muted-foreground">Certified Random Selection from {validEntries.length > 200 ? "200+" : validEntries.length} entries.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {winners.map((winner, index) => (
                    <div key={winner.id} className="space-y-4">
                      <WinnerCard winner={winner} index={index} />
                    </div>
                  ))}

                </div>

                <div className="flex justify-center pt-8">
                  <Button onClick={resetTool} variant="outline" className="border-2 border-black text-lg py-6 px-8 hover:bg-black hover:text-white transition-colors">
                    <RefreshCcw className="mr-2 w-5 h-5" /> Start New Giveaway
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogContent className="neo-box-static bg-white max-w-lg max-h-[85vh] flex flex-col">
              <DialogHeader className="pb-3 border-b-2 border-black flex-shrink-0">
                <DialogTitle className="text-2xl font-black uppercase">Schedule Giveaway</DialogTitle>
                <DialogDescription className="font-bold text-slate-600 text-sm mt-1">
                  Pick a date and time for this giveaway to run automatically.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* Important Notice */}
                <div className="bg-blue-50 border-2 border-blue-500 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-blue-900 uppercase text-xs">Scheduling Rules</p>
                    <ul className="text-xs font-medium text-blue-800 space-y-0.5">
                      <li>• Minimum: 15 minutes from now</li>
                      <li>• Maximum: 1 month in advance</li>
                      <li>• Only valid times are shown in the selectors</li>
                    </ul>
                  </div>
                </div>

                {/* Quick Date Selection */}
                <div className="space-y-2">
                  <Label className="font-black uppercase text-sm">Quick Select</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const minTime = new Date(new Date().getTime() + 15 * 60 * 1000);
                        setScheduleDate(minTime);
                        setScheduleTime(format(minTime, "HH:mm"));
                      }}
                      className="neo-input border-2 border-black hover:bg-slate-50 py-2 text-sm font-bold"
                    >
                      Earliest (15 min)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(12, 0, 0, 0);
                        setScheduleDate(tomorrow);
                        setScheduleTime("12:00");
                      }}
                      className="neo-input border-2 border-black hover:bg-slate-50 py-2 text-sm font-bold"
                    >
                      Tomorrow (Noon)
                    </Button>
                  </div>
                </div>

                {/* Calendar - Compact */}
                <div className="space-y-2">
                  <Label className="font-black uppercase text-sm">Or Pick a Date</Label>
                  <div className="flex justify-center py-2">
                    <Calendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={(date) => {
                        if (date) {
                          const now = new Date();
                          const selected = new Date(date);
                          const isToday = selected.toDateString() === now.toDateString();

                          if (isToday) {
                            const minTime = new Date(now.getTime() + 15 * 60 * 1000);
                            selected.setHours(minTime.getHours(), minTime.getMinutes(), 0, 0);
                            setScheduleTime(format(selected, "HH:mm"));
                          } else {
                            selected.setHours(12, 0, 0, 0);
                            setScheduleTime("12:00");
                          }
                          setScheduleDate(selected);
                        }
                      }}
                      className="rounded-md border-4 border-black shadow-neo-sm"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-3 p-2",
                        caption: "flex justify-center pt-1 relative items-center mb-3",
                        caption_label: "text-xl font-bold",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border-2 border-black rounded",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex mb-1",
                        head_cell: "text-muted-foreground rounded-md w-12 font-bold text-sm",
                        row: "flex w-full mt-1",
                        cell: "h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-12 w-12 p-0 font-bold text-sm aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded",
                        day_selected: "bg-[#E1306C] text-white hover:bg-[#E1306C] hover:text-white focus:bg-[#E1306C] focus:text-white",
                        day_today: "bg-slate-100 font-black",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const checkDate = new Date(date);
                        checkDate.setHours(0, 0, 0, 0);

                        // Don't allow dates before today
                        if (checkDate < today) {
                          return true;
                        }

                        // Don't allow dates more than 1 month in advance
                        const maxDate = new Date();
                        maxDate.setMonth(maxDate.getMonth() + 1);
                        maxDate.setHours(23, 59, 59, 999);

                        return checkDate > maxDate;
                      }}
                    />
                  </div>
                </div>

                {/* Time Selection with Scrollable Pickers */}
                <div className="space-y-2">
                  <Label className="font-black uppercase text-sm">Select Time</Label>
                  <div className="flex items-end gap-4">
                    {/* Hours Select */}
                    <div className="flex-1 space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Hour</Label>
                      <Select
                        value={scheduleTime ? scheduleTime.split(":")[0].padStart(2, "0") : "12"}
                        onValueChange={(value) => {
                          const currentMinutes = scheduleTime ? scheduleTime.split(":")[1] : "00";
                          const newTime = `${value.padStart(2, "0")}:${currentMinutes}`;
                          setScheduleTime(newTime);

                          // Auto-adjust minutes if needed for today + current hour
                          if (scheduleDate) {
                            const now = new Date();
                            const selected = new Date(scheduleDate);
                            const isToday = selected.toDateString() === now.toDateString();
                            const selectedHour = parseInt(value, 10);

                            if (isToday && selectedHour === now.getHours()) {
                              const minTime = new Date(now.getTime() + 15 * 60 * 1000);
                              let minMinute = minTime.getMinutes();
                              // If there are seconds, round up to next minute to ensure full 15 minutes
                              if (minTime.getSeconds() > 0 || minTime.getMilliseconds() > 0) {
                                minMinute = minMinute + 1;
                              }
                              const currentMinuteValue = parseInt(currentMinutes, 10);

                              if (currentMinuteValue < minMinute) {
                                setScheduleTime(`${value.padStart(2, "0")}:${String(minMinute).padStart(2, "0")}`);
                              }
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="neo-input border-2 border-black h-14 text-xl font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {(() => {
                            // If today, only show hours that are valid
                            if (scheduleDate) {
                              const now = new Date();
                              const selected = new Date(scheduleDate);
                              const isToday = selected.toDateString() === now.toDateString();

                              if (isToday) {
                                const minTime = new Date(now.getTime() + 15 * 60 * 1000);
                                const minHour = minTime.getHours();
                                // Show from minHour to 23
                                return Array.from({ length: 24 - minHour }, (_, i) => {
                                  const hour = minHour + i;
                                  return (
                                    <SelectItem key={hour} value={String(hour).padStart(2, "0")} className="text-lg py-3">
                                      {String(hour).padStart(2, "0")}:00
                                    </SelectItem>
                                  );
                                });
                              }
                            }
                            // For future dates, show all hours
                            return Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i).padStart(2, "0")} className="text-lg py-3">
                                {String(i).padStart(2, "0")}:00
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pb-2 text-2xl font-black">:</div>

                    {/* Minutes Select */}
                    <div className="flex-1 space-y-2">
                      <Label className="text-sm font-bold text-slate-600">Minute</Label>
                      <Select
                        value={scheduleTime ? scheduleTime.split(":")[1].padStart(2, "0") : "00"}
                        onValueChange={(value) => {
                          const currentHours = scheduleTime ? scheduleTime.split(":")[0] : "12";
                          const newTime = `${currentHours.padStart(2, "0")}:${value.padStart(2, "0")}`;
                          setScheduleTime(newTime);
                        }}
                      >
                        <SelectTrigger className="neo-input border-2 border-black h-14 text-xl font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {(() => {
                            // If today and selected hour is current hour, only show valid minutes
                            if (scheduleDate && scheduleTime) {
                              const now = new Date();
                              const selected = new Date(scheduleDate);
                              const isToday = selected.toDateString() === now.toDateString();
                              const [selectedHour] = scheduleTime.split(":").map(Number);

                              if (isToday && selectedHour === now.getHours()) {
                                const minTime = new Date(now.getTime() + 15 * 60 * 1000);
                                let minMinute = minTime.getMinutes();
                                // If there are seconds, round up to next minute to ensure full 15 minutes
                                if (minTime.getSeconds() > 0 || minTime.getMilliseconds() > 0) {
                                  minMinute = minMinute + 1;
                                }
                                // Show minutes from minMinute onwards (inclusive), allowing exactly 15 minutes
                                const availableMinutes = Math.min(60 - minMinute, 60);
                                return Array.from({ length: availableMinutes }, (_, i) => {
                                  const minute = minMinute + i;
                                  if (minute >= 60) return null;
                                  return (
                                    <SelectItem key={minute} value={String(minute).padStart(2, "0")} className="text-lg py-3">
                                      {String(minute).padStart(2, "0")}
                                    </SelectItem>
                                  );
                                }).filter(Boolean);
                              }

                              // For future hours today, show all minutes
                              if (isToday && selectedHour > now.getHours()) {
                                return Array.from({ length: 60 }, (_, i) => (
                                  <SelectItem key={i} value={String(i).padStart(2, "0")} className="text-lg py-3">
                                    {String(i).padStart(2, "0")}
                                  </SelectItem>
                                ));
                              }
                            }

                            // For future dates, show all minutes
                            return Array.from({ length: 60 }, (_, i) => (
                              <SelectItem key={i} value={String(i).padStart(2, "0")} className="text-lg py-3">
                                {String(i).padStart(2, "0")}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Confirmation Message */}
                  {scheduleDate && scheduleTime && (
                    <div className="text-sm p-3 rounded-lg border-2 bg-green-50 text-green-800 border-green-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-bold">
                          Scheduled for {format(new Date(scheduleDate), "MMM d, yyyy")} at {scheduleTime}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Date Display */}
                {scheduleDate && (
                  <div className="bg-slate-50 border-4 border-black p-5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm uppercase text-slate-600 mb-1">Scheduled For</p>
                        <p className="font-black text-xl">
                          {format(scheduleDate, "MMMM d, yyyy")} at {scheduleTime}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSchedule}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold border-2 border-red-300"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col gap-3 sm:flex-row pt-4 border-t-2 border-black flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setScheduleOpen(false);
                    if (scheduleDate) {
                      handleClearSchedule();
                    }
                  }}
                  className="w-full sm:w-auto border-2 border-black font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetScheduleTime}
                  disabled={!scheduleDate || !scheduleTime}
                  className="neo-btn-primary bg-[#E1306C] text-white w-full sm:w-auto font-bold text-lg py-6"
                >
                  Set Schedule Time
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* User Giveaways Section */}
          {/* User Giveaways Section removed for stateless version */}
        </div>

        {/* Customization Dialog */}
        <Dialog open={customizationOpen} onOpenChange={setCustomizationOpen}>
          <DialogContent className="neo-box-static bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase">Customize Theme</DialogTitle>
              <DialogDescription>Personalize your giveaway experience</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="font-bold uppercase">Theme</Label>
                <Select value={customTheme} onValueChange={(v) => setCustomTheme(v as any)}>
                  <SelectTrigger className="neo-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="pink">Instagram Pink</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {customTheme === "custom" && (
                <div className="space-y-2">
                  <Label className="font-bold uppercase">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="neo-input flex-1"
                      placeholder="#E1306C"
                    />
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border-2 border-black p-4 rounded">
                <p className="text-xs text-muted-foreground">
                  Customization settings are saved locally in your browser.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setCustomizationOpen(false)} className="neo-btn-primary bg-black text-white w-full">
                Save Preferences
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}


