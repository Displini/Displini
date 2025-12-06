import { Skeleton } from "@/app/components/ui/skeleton";
import { Card } from "@/app/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </Card>
  );
}

