import Layout from "@/components/layout";
import { useState, useEffect } from "react";
import { BarChart3, Users, Trophy, Calendar, Hash, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/seo";

interface AnalyticsData {
  totalGiveaways: number;
  completedGiveaways: number;
  pendingGiveaways: number;
  totalWinners: number;
  averageEntriesPerGiveaway: number;
  mostCommonHashtags: string[];
  mostCommonMentions: string[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch analytics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-12">
          <div className="text-center">Loading analytics...</div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <SEO title="Giveaway Analytics" description="View analytics and statistics for your giveaways" url="/analytics" noindex />
        <div className="max-w-6xl mx-auto py-12">
          <div className="text-center text-red-500">Failed to load analytics</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Giveaway Analytics" description="View analytics and statistics for your giveaways" url="/analytics" noindex />
      <div className="max-w-6xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-4">Analytics Dashboard</h1>
          <p className="text-lg font-medium text-muted-foreground">Track your giveaway performance</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      </div>
    </Layout>
  );
}
