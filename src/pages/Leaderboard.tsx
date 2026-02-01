import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Loader2, Star } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { LeaderboardCard } from "@/components/gamification/LeaderboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/types/pdf";
import { BADGE_INFO } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false })
        .limit(50);

      if (error) throw error;
      setProfiles((data || []) as Profile[]);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const badgeTypes = Object.entries(BADGE_INFO).reverse();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">
            Top contributors who make LearnLoop awesome
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Badges Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {badgeTypes.map(([key, info]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Badge className={info.color}>{info.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {info.minPoints}+ pts
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earn Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upload PDF</span>
                  <span className="font-medium text-primary">+10 pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PDF Downloaded</span>
                  <span className="font-medium text-primary">+1 pt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate a PDF</span>
                  <span className="font-medium text-primary">+2 pts</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-20">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No contributors yet</h3>
                <p className="text-muted-foreground">
                  Be the first to upload a PDF and start earning points!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Top 3 Podium */}
                {profiles.length >= 3 && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* 2nd Place */}
                    <Card className="bg-muted/50 mt-8">
                      <CardContent className="pt-6 text-center">
                        <Medal className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="font-semibold truncate">{profiles[1].student_name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{profiles[1].points} pts</p>
                      </CardContent>
                    </Card>
                    
                    {/* 1st Place */}
                    <Card className="bg-primary/10 border-primary/30">
                      <CardContent className="pt-6 text-center">
                        <Trophy className="h-10 w-10 mx-auto text-chart-4 mb-2" />
                        <p className="font-bold truncate">{profiles[0].student_name || 'Anonymous'}</p>
                        <p className="text-sm text-primary font-medium">{profiles[0].points} pts</p>
                      </CardContent>
                    </Card>
                    
                    {/* 3rd Place */}
                    <Card className="bg-muted/30 mt-12">
                      <CardContent className="pt-6 text-center">
                        <Award className="h-7 w-7 mx-auto text-chart-1 mb-2" />
                        <p className="font-semibold truncate">{profiles[2].student_name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{profiles[2].points} pts</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Full List */}
                {profiles.map((profile, index) => (
                  <LeaderboardCard key={profile.id} profile={profile} rank={index + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
