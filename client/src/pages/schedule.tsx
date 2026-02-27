import Layout from "@/components/layout";
import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { format, differenceInMilliseconds, formatDistanceStrict } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Calendar as CalendarIcon, Save, X, AlertCircle, CheckCircle, Trash2, Trophy, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SEO } from "@/components/seo";

interface Winner {
  username: string;
  text?: string;
  comment?: string;
}

interface Giveaway {
  id: string;
  scheduledFor: string;
  status: string;
  winners?: Winner[];
  config: {
    url: string;
    mode: string;
    winnerCount: number;
    keyword?: string;
    minMentions?: number;
    duplicateCheck?: boolean;
    blockList?: string;
    bonusChances?: boolean;
    excludeFraud?: boolean;
    contactEmail?: string;
    _scheduler?: {
      finalizedAt?: string;
      preparedAt?: string;
      queuedAt?: string;
    };
  };
  accessToken?: string;
}

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const EXPIRY_HOURS = 24;

function isExpired(giveaway: Giveaway): boolean {
  const finalizedAt = giveaway.config?._scheduler?.finalizedAt;
  if (!finalizedAt) return false;
  const expiresAt = new Date(finalizedAt).getTime() + EXPIRY_HOURS * 60 * 60 * 1000;
  return Date.now() > expiresAt;
}

export default function SchedulePage() {
  const [, params] = useRoute<{ token: string }>("/schedule/:token");
  const token = params?.token;
  const { toast } = useToast();

  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Form state
  const [url, setUrl] = useState("");
  const [winnerCount, setWinnerCount] = useState(1);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [minMentions, setMinMentions] = useState(1);
  const [requireMention, setRequireMention] = useState(false);
  const [excludeDuplicates, setExcludeDuplicates] = useState(true);
  const [blockList, setBlockList] = useState("");
  const [enableBonusChances, setEnableBonusChances] = useState(false);
  const [excludeFraud, setExcludeFraud] = useState(true);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [scheduleEmail, setScheduleEmail] = useState("");

  const populateForm = (data: Giveaway) => {
    setUrl(data.config.url || "");
    setWinnerCount(data.config.winnerCount || 1);
    setFilterKeyword(data.config.keyword || "");
    setMinMentions(data.config.minMentions || 1);
    setRequireMention((data.config.minMentions ?? 0) > 0);
    setExcludeDuplicates(data.config.duplicateCheck !== false);
    setBlockList(data.config.blockList || "");
    setEnableBonusChances(data.config.bonusChances || false);
    setExcludeFraud(data.config.excludeFraud !== false);
    setScheduleEmail(data.config.contactEmail || "");
    const scheduledDate = new Date(data.scheduledFor);
    setScheduleDate(scheduledDate);
    setScheduleTime(format(scheduledDate, "HH:mm"));
  };

  // Initial fetch
  useEffect(() => {
    if (!token) return;

    const fetchGiveaway = async () => {
      try {
        const response = await fetch(`/api/giveaways/${token}`);
        if (!response.ok) throw new Error("Giveaway not found");
        const data: Giveaway = await response.json();
        setGiveaway(data);
        populateForm(data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load giveaway. It may have been deleted or the link is invalid.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGiveaway();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-poll when pending
  useEffect(() => {
    if (!token || !giveaway) return;

    // Only poll while pending
    if (giveaway.status !== "pending") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch(`/api/giveaways/${token}`);
        if (!response.ok) return;
        const data: Giveaway = await response.json();
        // Update state if status changed
        if (data.status !== giveaway.status || data.winners !== giveaway.winners) {
          setGiveaway(data);
        }
      } catch {
        // Silently ignore poll errors
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token, giveaway?.status]);

  // Countdown timer
  useEffect(() => {
    if (!giveaway) return;

    const updateCountdown = () => {
      const now = new Date();
      const scheduled = new Date(giveaway.scheduledFor);
      setTimeRemaining(differenceInMilliseconds(scheduled, now));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [giveaway]);

  const isLocked = timeRemaining !== null && timeRemaining < 15 * 60 * 1000;
  const showCountdown = timeRemaining !== null && timeRemaining < 60 * 60 * 1000;

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Time's up!";
    return formatDistanceStrict(new Date(), new Date(Date.now() + ms), { addSuffix: false });
  };

  const handleSave = async () => {
    if (!giveaway || !scheduleDate) return;

    const finalDate = new Date(scheduleDate);
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    finalDate.setHours(hours, minutes);

    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000);
    if (finalDate < minTime) {
      toast({
        title: "Invalid Time",
        description: `Scheduled time must be at least 15 minutes from now. Minimum: ${format(minTime, "MMM d, yyyy 'at' HH:mm")}`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const config = {
        url,
        mode: "comments",
        winnerCount,
        keyword: filterKeyword,
        minMentions: requireMention ? minMentions : 0,
        duplicateCheck: excludeDuplicates,
        blockList,
        bonusChances: enableBonusChances,
        excludeFraud,
        contactEmail: scheduleEmail,
      };

      const response = await fetch(`/api/giveaways/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: finalDate.toISOString(), config }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      const updated = await response.json();
      setGiveaway(updated);
      toast({ title: "Saved!", description: "Giveaway settings updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!giveaway || !token) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/giveaways/${token}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel");
      }

      toast({ title: "Cancelled", description: "Giveaway has been cancelled successfully." });
      setTimeout(() => { window.location.href = "/"; }, 2000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to cancel giveaway", variant: "destructive" });
    } finally {
      setSaving(false);
      setShowCancelDialog(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <SEO title="Manage Scheduled Giveaway" description="View and manage your scheduled giveaway settings" url={`/schedule/${token}`} noindex />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin text-[#E1306C] mb-6" />
          <h2 className="text-2xl font-bold uppercase">Loading giveaway...</h2>
        </div>
      </Layout>
    );
  }

  if (!giveaway) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Giveaway Not Found</h2>
          <p className="text-muted-foreground mb-6">This giveaway may have been deleted or the link is invalid.</p>
          <Button onClick={() => (window.location.href = "/")}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  // 24-hour expiry: show expired view when giveaway completed and results window closed
  if (giveaway.status === "completed" && isExpired(giveaway)) {
    return (
      <Layout>
        <SEO title="Giveaway Results Expired" description="This giveaway's results are no longer available" url={`/schedule/${token}`} noindex />
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <Lock className="w-16 h-16 mx-auto mb-6 text-slate-400" />
          <h2 className="text-3xl font-black uppercase mb-4">Results No Longer Available</h2>
          <p className="text-muted-foreground text-lg mb-8">
            This giveaway's results were available for 24 hours after completion and have now expired.
          </p>
          <Button onClick={() => (window.location.href = "/")}>Run a New Giveaway</Button>
        </div>
      </Layout>
    );
  }

  // Completed view — show winners
  if (giveaway.status === "completed") {
    const winners = giveaway.winners || [];
    const finalizedAt = giveaway.config?._scheduler?.finalizedAt;
    const expiresAt = finalizedAt
      ? new Date(new Date(finalizedAt).getTime() + EXPIRY_HOURS * 60 * 60 * 1000)
      : null;

    return (
      <Layout>
        <SEO title="Giveaway Complete — Winners!" description="Your giveaway has finished. See the winners." url={`/schedule/${token}`} noindex />
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-4xl font-black uppercase mb-2">Giveaway Complete!</h1>
            <p className="text-muted-foreground">
              Ran on {format(new Date(giveaway.scheduledFor), "MMMM d, yyyy 'at' HH:mm")}
            </p>
            {expiresAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Results available until {format(expiresAt, "MMM d, yyyy 'at' HH:mm")}
              </p>
            )}
          </div>

          <div className="neo-box p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-black uppercase">
                {winners.length === 1 ? "Winner" : `Winners (${winners.length})`}
              </h2>
            </div>

            {winners.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No winners selected — no valid entries found.</p>
            ) : (
              <div className="space-y-3">
                {winners.map((winner, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                    <span className="font-black text-2xl text-yellow-600 min-w-[2rem]">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-lg">@{winner.username}</p>
                      {(winner.comment || winner.text) && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {winner.comment || winner.text}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Button onClick={() => (window.location.href = "/")}>Run Another Giveaway</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Failed view
  if (giveaway.status === "failed") {
    return (
      <Layout>
        <SEO title="Giveaway Failed" description="There was an issue with your scheduled giveaway" url={`/schedule/${token}`} noindex />
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
          <h2 className="text-3xl font-black uppercase mb-4">Giveaway Failed</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Something went wrong while running your giveaway. Please contact support or try scheduling a new one.
          </p>
          <Button onClick={() => (window.location.href = "/")}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  // Pending view — editable + live status
  const scheduledDate = new Date(giveaway.scheduledFor);
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    completed: "bg-green-100 text-green-800 border-green-300",
    failed: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <Layout>
      <SEO title="Manage Scheduled Giveaway" description="View and manage your scheduled giveaway settings" url={`/schedule/${token}`} noindex />
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-black uppercase">Manage Giveaway</h1>
            <div className="flex items-center gap-2">
              <span
                className={`px-4 py-2 rounded-full border-2 font-bold uppercase text-sm ${statusColors[giveaway.status] || statusColors.pending}`}
              >
                {giveaway.status}
              </span>
              {giveaway.status === "pending" && (
                <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
              )}
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-black p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <CalendarIcon className="w-5 h-5" />
              <div>
                <p className="font-bold text-lg">
                  Scheduled for: {format(scheduledDate, "MMMM d, yyyy 'at' HH:mm")}
                </p>
              </div>
            </div>

            {showCountdown && timeRemaining !== null && (
              <div className="mt-6 mb-2">
                <div className="bg-black text-white p-6 rounded-lg border-4 border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-2">Time Remaining</p>
                  <div className="text-4xl sm:text-6xl font-black font-mono tracking-tighter flex items-center justify-center gap-4">
                    <Clock className="w-8 h-8 sm:w-12 sm:h-12 animate-pulse text-[#E1306C]" />
                    {formatTimeRemaining(timeRemaining)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLocked && (
            <div className="mt-4 bg-yellow-100 border-2 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="font-bold text-yellow-800">
                  Giveaway is locked. Less than 15 minutes remaining. Editing and cancellation are disabled.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          {/* URL */}
          <div className="neo-box p-6">
            <Label className="font-bold text-lg uppercase mb-2">Instagram Post URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="neo-input"
              disabled={isLocked}
            />
          </div>

          {/* Schedule Date/Time */}
          <div className="neo-box p-6">
            <Label className="font-bold text-lg uppercase mb-2">Schedule Date & Time</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="neo-input justify-start text-left font-normal"
                    disabled={isLocked}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="neo-input"
                disabled={isLocked}
              />
            </div>
          </div>

          {/* Email */}
          <div className="neo-box p-6">
            <Label className="font-bold text-lg uppercase mb-2">Contact Email</Label>
            <Input
              type="email"
              value={scheduleEmail}
              onChange={(e) => setScheduleEmail(e.target.value)}
              placeholder="you@email.com"
              className="neo-input"
              disabled={isLocked}
            />
          </div>

          {/* Winner Count */}
          <div className="neo-box p-6">
            <Label className="font-bold text-lg uppercase mb-2">Number of Winners</Label>
            <Select value={String(winnerCount)} onValueChange={(v) => setWinnerCount(Number(v))} disabled={isLocked}>
              <SelectTrigger className="neo-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="neo-box p-6 space-y-4">
            <h3 className="font-bold text-lg uppercase border-b-2 border-black pb-2">Filters</h3>

            <div>
              <Label className="font-bold uppercase">Keyword Filter</Label>
              <Input
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="Only include comments with this keyword"
                className="neo-input"
                disabled={isLocked}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white border-2 border-slate-200">
              <Label className="font-bold text-lg uppercase">Require Mentions</Label>
              <Switch
                checked={requireMention}
                onCheckedChange={setRequireMention}
                disabled={isLocked}
                className="data-[state=checked]:bg-black border-2 border-black"
              />
            </div>

            {requireMention && (
              <div>
                <Label className="font-bold uppercase">Minimum Mentions</Label>
                <Select
                  value={String(minMentions)}
                  onValueChange={(v) => setMinMentions(Number(v))}
                  disabled={isLocked}
                >
                  <SelectTrigger className="neo-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-white border-2 border-slate-200">
              <Label className="font-bold text-lg uppercase">Exclude Duplicates</Label>
              <Switch
                checked={excludeDuplicates}
                onCheckedChange={setExcludeDuplicates}
                disabled={isLocked}
                className="data-[state=checked]:bg-black border-2 border-black"
              />
            </div>

            <div>
              <Label className="font-bold uppercase">Block List (One username per line)</Label>
              <Textarea
                value={blockList}
                onChange={(e) => setBlockList(e.target.value)}
                placeholder="Enter usernames to exclude, one per line"
                className="neo-input min-h-[100px]"
                disabled={isLocked}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white border-2 border-slate-200">
              <Label className="font-bold text-lg uppercase">Bonus Chances</Label>
              <Switch
                checked={enableBonusChances}
                onCheckedChange={setEnableBonusChances}
                disabled={isLocked}
                className="data-[state=checked]:bg-black border-2 border-black"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white border-2 border-slate-200">
              <Label className="font-bold text-lg uppercase">Exclude Fraud</Label>
              <Switch
                checked={excludeFraud}
                onCheckedChange={setExcludeFraud}
                disabled={isLocked}
                className="data-[state=checked]:bg-black border-2 border-black"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={isLocked || saving}
              className="flex-1 neo-btn-primary bg-[#E1306C] text-white"
            >
              {saving ? (
                <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 w-4 h-4" /> Save Changes</>
              )}
            </Button>
            <Button
              onClick={() => setShowCancelDialog(true)}
              disabled={isLocked || saving}
              variant="destructive"
              className="neo-btn-secondary border-red-500 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 w-4 h-4" /> Cancel Giveaway
            </Button>
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="neo-box-static bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase">Cancel Giveaway?</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this scheduled giveaway? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Scheduled
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Cancelling...</>
                ) : (
                  "Yes, Cancel"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
