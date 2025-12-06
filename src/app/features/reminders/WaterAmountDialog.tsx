import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Droplet, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface WaterAmountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  unit: "ml" | "oz";
}

export default function WaterAmountDialog({ isOpen, onClose, onConfirm, unit }: WaterAmountDialogProps) {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    onConfirm(numAmount);
    setAmount("");
    setIsSubmitting(false);
    onClose();
  };

  const quickAmounts = unit === 'ml' ? [250, 500, 750, 1000] : [8, 16, 24, 32];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" />
              How much water did you drink?
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId: 'water' } }));
                onClose();
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Water Settings
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="water-amount">Amount ({unit})</Label>
            <Input
              id="water-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount in ${unit}`}
              min="1"
              step="1"
              required
            />
          </div>

          <div>
            <Label>Quick Add</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="flex-1"
                >
                  {quickAmount} {unit}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {(() => {
              const isValid = amount && parseFloat(amount) > 0;
              return (
            <Button 
              type="submit" 
                  className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "Adding..." : "Add Water"}
            </Button>
              );
            })()}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
