import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";

interface ComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function ComingSoonDialog({ 
  open, 
  onOpenChange,
  title = "Coming Soon!",
  description = "We're working hard to bring you this feature. Stay tuned for updates!"
}: ComingSoonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
            <Rocket className="h-8 w-8 text-white animate-bounce" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 py-4">
          <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
          <p className="text-sm text-muted-foreground">
            Get ready for something amazing!
          </p>
          <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
        </div>
        <Button 
          onClick={() => onOpenChange(false)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          Got it!
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy usage
export function useComingSoonDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    open,
    close,
    Dialog: () => <ComingSoonDialog open={isOpen} onOpenChange={setIsOpen} />
  };
}

