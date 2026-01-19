import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { BarChart3, Settings, Sun, Moon } from "lucide-react";

interface GenericHeaderProps {
  showDateCarousel?: boolean;
  dateCarouselComponent?: React.ReactNode;
  showViewModes?: boolean;
  viewModesComponent?: React.ReactNode;
  showTabButtons?: boolean;
  tabButtonsComponent?: React.ReactNode;
  onSettingsClick?: () => void;
  onStatsClick?: () => void;
}

export default function GenericHeader({
  showDateCarousel,
  dateCarouselComponent,
  showViewModes,
  viewModesComponent,
  showTabButtons,
  tabButtonsComponent,
  onSettingsClick,
  onStatsClick,
}: GenericHeaderProps) {
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
        <div className="px-4 py-4 space-y-4">
          {/* Header Actions Row */}
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenuDialog(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Date Carousel - Only show if enabled */}
          {showDateCarousel && dateCarouselComponent && (
            <>
              {dateCarouselComponent}
            </>
          )}

          {/* Tab Buttons - Only show if enabled (for Reminders) */}
          {showTabButtons && tabButtonsComponent && (
            <>
              {tabButtonsComponent}
            </>
          )}

          {/* View Mode Buttons - Only show if enabled (for Calendar) */}
          {showViewModes && viewModesComponent && (
            <>
              {viewModesComponent}
            </>
          )}
        </div>
      </div>

      {/* Side Menu Dialog */}
      <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                onStatsClick?.();
                setShowMenuDialog(false);
              }}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistics</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                onSettingsClick?.();
                setShowMenuDialog(false);
              }}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>

            <div className="flex items-center justify-between px-2 py-2 border rounded">
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isDarkMode ? "Dark" : "Light"} Mode
                </span>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={(checked) => {
                  setIsDarkMode(checked);
                  if (checked) {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
