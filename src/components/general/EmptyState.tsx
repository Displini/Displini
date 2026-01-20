import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  onAdd: () => void;
  message?: string;
}

/**
 * Standardized empty state for all containers
 * Shows centered + circle button
 */
export function EmptyState({ onAdd, message = "No data yet" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Button
        size="icon"
        variant="outline"
        className="h-16 w-16 rounded-full"
        onClick={onAdd}
        title="Add first item"
      >
        <Plus className="w-8 h-8" />
      </Button>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

