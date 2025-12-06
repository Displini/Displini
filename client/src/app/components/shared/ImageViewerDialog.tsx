import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageViewerDialogProps {
  images: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

export default function ImageViewerDialog({
  images,
  open,
  onOpenChange,
  initialIndex = 0,
}: ImageViewerDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Reset to initial index when dialog opens
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] p-4">
        {/* Image container with proper aspect ratio */}
        <div className="relative w-full min-h-[500px] max-h-[75vh] bg-muted/20 rounded-2xl overflow-hidden flex items-center justify-center">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />
          
          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Image counter below image */}
        {images.length > 1 && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            Image {currentIndex + 1} of {images.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

