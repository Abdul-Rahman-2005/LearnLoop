import { Trophy, Medal, Award, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BADGE_INFO } from "@/lib/constants";
import { Profile } from "@/types/pdf";

interface LeaderboardCardProps {
  profile: Profile;
  rank: number;
}

export function LeaderboardCard({ profile, rank }: LeaderboardCardProps) {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-chart-4" />;
      case 2:
        return <Medal className="h-6 w-6 text-muted-foreground" />;
      case 3:
        return <Award className="h-6 w-6 text-chart-1" />;
      default:
        return <span className="font-bold text-lg text-muted-foreground">#{rank}</span>;
    }
  };

  const badgeInfo = BADGE_INFO[profile.badge];

  return (
    <Card className={`transition-all ${rank <= 3 ? 'border-primary/30 bg-primary/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 flex items-center justify-center">
            {getRankIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {profile.student_name || 'Anonymous'}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile.branch || 'Unknown Branch'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={badgeInfo.color}>
              {badgeInfo.label}
            </Badge>
            <div className="flex items-center gap-1 text-primary">
              <Star className="h-4 w-4 fill-primary" />
              <span className="font-bold">{profile.points}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
