import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import { X, Info } from "lucide-react";

interface UniversalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  hideDefaultFooter?: boolean;
  scrollable?: boolean; // Enable scrolling for long content
  infoContent?: ReactNode; // Info content to show in info dialog
  infoTitle?: string; // Title for info dialog
}

export default function UniversalDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onSave,
  onCancel,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  hideDefaultFooter = false,
  scrollable = true,
  infoContent,
  infoTitle,
}: UniversalDialogProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-md ${scrollable ? 'max-h-[90vh] overflow-y-auto' : ''} [&>button]:hidden`}>
          <DialogHeader className="relative">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
              </div>
              <div className="flex items-center gap-2">
                {infoContent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowInfo(true)}
                    aria-label="Show information"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {children}
        </div>

        {!hideDefaultFooter && (
          <DialogFooter>
            {footer || (
              <div className="flex gap-2 w-full sm:w-auto">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 sm:flex-initial"
                  >
                    {cancelLabel}
                  </Button>
                )}
                {onSave && (
                  <Button
                    type="button"
                    onClick={onSave}
                    className="flex-1 sm:flex-initial"
                  >
                    {saveLabel}
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
    
    {/* Info Dialog */}
    {infoContent && (
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>{infoTitle || `${title} Information`}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowInfo(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="py-4">
            {infoContent}
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}

