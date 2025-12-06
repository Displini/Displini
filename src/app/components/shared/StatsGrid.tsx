import { Card } from "@/app/components/ui/card";
import { TrendingUp, Target, Flame } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  color: string;
}

interface StatsGridProps {
  stats: Stat[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="p-4 text-center" data-testid={`card-stat-${idx}`}>
            <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-xl font-bold font-mono" data-testid={`text-stat-value-${idx}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
}
