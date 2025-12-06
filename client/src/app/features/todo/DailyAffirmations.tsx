import { useState, useEffect } from "react";
import { Sparkles, Settings } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { UniversalDialog } from "@/app/components/shared";

const affirmations = [
  "You are capable of amazing things today.",
  "Every step forward is progress, no matter how small.",
  "You have the strength to overcome any challenge.",
  "Today is full of possibilities and opportunities.",
  "You are exactly where you need to be right now.",
  "Your positive energy creates positive outcomes.",
  "You are growing stronger and wiser every day.",
  "Believe in yourself - you've got this!",
  "You deserve all the good things coming your way.",
  "Your efforts are making a difference.",
  "You are worthy of success and happiness.",
  "Trust the journey, even when you don't understand it.",
  "You are enough, just as you are.",
  "Your best is always good enough.",
  "Today, you choose peace and positivity.",
  "You have unlimited potential within you.",
  "Every challenge is an opportunity to grow.",
  "You are creating the life you want.",
  "Your resilience is your superpower.",
  "You radiate confidence and grace.",
];

interface AffirmationSettings {
  enabled: boolean;
  showOnTimeline: boolean;
}

export function DailyAffirmations() {
  const [settings, setSettings] = useState<AffirmationSettings>(() => {
    const saved = localStorage.getItem('affirmation_settings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      showOnTimeline: false,
    };
  });
  
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('affirmation_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('affirmationSettingsChanged'));
  }, [settings]);

  const getDailyAffirmation = () => {
    const today = new Date().toDateString();
    const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % affirmations.length;
    return affirmations[index];
  };

  const affirmation = getDailyAffirmation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Daily Affirmation</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSettingsOpen(true)}
          className="h-8 w-8"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {settings.enabled && (
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            <p className="text-base leading-relaxed text-foreground font-medium">
              {affirmation}
            </p>
          </div>
        </div>
      )}

      <UniversalDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="Daily Affirmation Settings"
        hideDefaultFooter
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Daily Affirmations</Label>
              <p className="text-xs text-muted-foreground">
                Show a motivational message each day
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show on Timeline</Label>
              <p className="text-xs text-muted-foreground">
                Display affirmation above your first task
              </p>
            </div>
            <Switch
              checked={settings.showOnTimeline}
              onCheckedChange={(showOnTimeline) => setSettings({ ...settings, showOnTimeline })}
              disabled={!settings.enabled}
            />
          </div>

          {settings.enabled && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-2">Today's Affirmation:</p>
              <p className="text-sm font-medium text-foreground italic">
                "{affirmation}"
              </p>
            </div>
          )}
        </div>
      </UniversalDialog>
    </div>
  );
}

export function getAffirmationSettings(): AffirmationSettings {
  const saved = localStorage.getItem('affirmation_settings');
  return saved ? JSON.parse(saved) : { enabled: false, showOnTimeline: false };
}

export function getDailyAffirmationText(): string {
  const today = new Date().toDateString();
  const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % affirmations.length;
  return affirmations[index];
}

