import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Plus } from "lucide-react";

interface FeatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  stats?: {
    label: string;
    value: number;
  }[];
  onAddClick?: () => void;
  addButtonText?: string;
  showAddButton?: boolean;
  stickyHeader?: boolean;
}

export default function FeatureDialog({
  isOpen,
  onClose,
  title,
  icon,
  children,
  stats,
  onAddClick,
  addButtonText = "Add New",
  showAddButton = true,
  stickyHeader = true,
}: FeatureDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header - Sticky */}
          {(stats || showAddButton) && (
            <div className={`${stickyHeader ? 'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60' : ''} pb-4 mb-4`}>
              <div className="flex justify-between items-center">
                {stats && stats.length > 0 && (
                  <div className="flex items-center space-x-6">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        {stat.label && <p className="text-sm text-muted-foreground">{stat.label}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {showAddButton && onAddClick && (
                  <Button 
                    onClick={onAddClick} 
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addButtonText}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

