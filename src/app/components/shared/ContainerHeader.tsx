import { Button } from "@/app/components/ui/button";
import { Plus, Settings, Edit, Calendar, LucideIcon } from "lucide-react";

interface ContainerHeaderProps {
  onAdd?: () => void;
  onSettings?: () => void;
  onEdit?: () => void;
  customButtons?: Array<{
    icon: LucideIcon;
    onClick: () => void;
    title?: string;
  }>;
}

/**
 * Standardized header for all containers
 * Follows Menstrual Cycle pattern: flex row of icon buttons
 */
export function ContainerHeader({ onAdd, onSettings, onEdit, customButtons = [] }: ContainerHeaderProps) {
  const hasAnyButton = onAdd || onSettings || onEdit || customButtons.length > 0;
  
  if (!hasAnyButton) return null;
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-2">
        {customButtons.map((btn, idx) => {
          const Icon = btn.icon;
          return (
            <Button
              key={idx}
              size="icon"
              variant="ghost"
              onClick={btn.onClick}
              title={btn.title}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
        
        {onAdd && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onAdd}
            title="Add"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
        
        {onSettings && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onSettings}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
        
        {onEdit && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

