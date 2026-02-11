import Layout from "@/components/layout";
import { useState, useEffect } from "react";
import { BarChart3, Users, Trophy, Calendar, Hash, TrendingUp, Plus, Trash2, Eye, MousePointer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  totalGiveaways: number;
  completedGiveaways: number;
  pendingGiveaways: number;
  totalWinners: number;
  averageEntriesPerGiveaway: number;
  mostCommonHashtags: string[];
  mostCommonMentions: string[];
}

interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAd, setNewAd] = useState({ imageUrl: "", linkUrl: "" });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [analyticsRes, adsRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/admin/ads")
      ]);

      if (analyticsRes.ok) {
        setData(await analyticsRes.json());
      }

      if (adsRes.ok) {
        setAds(await adsRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAd = async () => {
    if (!newAd.imageUrl || !newAd.linkUrl) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAd)
      });

      if (!res.ok) throw new Error("Failed to create ad");

      toast({ title: "Success", description: "Ad created successfully" });
      setNewAd({ imageUrl: "", linkUrl: "" });
      setIsCreateOpen(false);
      fetchData(); // Refresh list
    } catch (err) {
      toast({ title: "Error", description: "Failed to create ad", variant: "destructive" });
    }
  };

  const handleToggleAd = async (ad: Ad) => {
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !ad.active })
      });

      if (!res.ok) throw new Error("Failed to update ad");

      // Optimistic update
      setAds(ads.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
    } catch (err) {
      toast({ title: "Error", description: "Failed to update ad", variant: "destructive" });
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete ad");

      setAds(ads.filter(a => a.id !== id));
      toast({ title: "Success", description: "Ad deleted" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete ad", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-12 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <SEO title="Dashboard" description="Admin dashboard" url="/analytics" noindex />
        <div className="max-w-6xl mx-auto py-12">
          <div className="text-center text-red-500">Failed to load analytics</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Dashboard" description="Admin dashboard" url="/analytics" noindex />
      <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase">Dashboard</h1>
            <p className="text-base sm:text-lg font-medium text-muted-foreground">Manage your giveaways and ads</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ads">Ad Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="neo-box bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Giveaways</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalGiveaways}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card className="neo-box bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.completedGiveaways}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.totalGiveaways > 0
                      ? `${Math.round((data.completedGiveaways / data.totalGiveaways) * 100)}% success rate`
                      : '0% success rate'}
                  </p>
                </CardContent>
              </Card>

              <Card className="neo-box bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Winners</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalWinners}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.completedGiveaways > 0
                      ? `${Math.round(data.totalWinners / data.completedGiveaways)} per giveaway`
                      : '0 per giveaway'}
                  </p>
                </CardContent>
              </Card>

              <Card className="neo-box bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Entries</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.averageEntriesPerGiveaway}</div>
                  <p className="text-xs text-muted-foreground">Per giveaway</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="neo-box bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" /> Most Common Hashtags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.mostCommonHashtags.length > 0 ? (
                    <div className="space-y-2">
                      {data.mostCommonHashtags.map((tag, i) => (
                        <div key={tag} className="flex items-center justify-between p-2 bg-slate-50 border-2 border-black">
                          <span className="font-bold">#{tag}</span>
                          <span className="text-sm text-muted-foreground">#{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hashtags tracked yet</p>
                  )}
                </CardContent>
              </Card>

              <Card className="neo-box bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-300">
                      <span className="font-bold">Completed</span>
                      <span className="text-2xl font-black">{data.completedGiveaways}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border-2 border-yellow-300">
                      <span className="font-bold">Pending</span>
                      <span className="text-2xl font-black">{data.pendingGiveaways}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 border-2 border-red-300">
                      <span className="font-bold">Failed</span>
                      <span className="text-2xl font-black">
                        {data.totalGiveaways - data.completedGiveaways - data.pendingGiveaways}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ads" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Active Advertisements</h2>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Create Ad
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Advertisement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        placeholder="https://..."
                        value={newAd.imageUrl}
                        onChange={e => setNewAd({ ...newAd, imageUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkUrl">Link URL (Target)</Label>
                      <Input
                        id="linkUrl"
                        placeholder="https://..."
                        value={newAd.linkUrl}
                        onChange={e => setNewAd({ ...newAd, linkUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateAd}>Create Ad</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {ads.map(ad => (
                <Card key={ad.id} className="neo-box bg-white relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${ad.active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <CardContent className="p-6 pl-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                      <div className="w-full md:w-[200px] h-[60px] bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                        <img src={ad.imageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg truncate">{ad.linkUrl}</p>
                          {!ad.active && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">INACTIVE</span>}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {ad.impressions} Views
                          </div>
                          <div className="flex items-center gap-1">
                            <MousePointer className="w-4 h-4" /> {ad.clicks} Clicks
                          </div>
                          <div className="font-bold">
                            CTR: {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <div className="flex items-center gap-2 mr-4">
                          <Label htmlFor={`active-${ad.id}`} className="text-sm font-medium">Active</Label>
                          <Switch
                            id={`active-${ad.id}`}
                            checked={ad.active}
                            onCheckedChange={() => handleToggleAd(ad)}
                          />
                        </div>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteAd(ad.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {ads.length === 0 && (
                <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-muted-foreground mb-4">No advertisements created yet</p>
                  <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create your first ad</Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
