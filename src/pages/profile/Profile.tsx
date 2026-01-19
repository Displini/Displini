import { useState, useEffect, lazy, Suspense } from "react";
import { SEO } from "@/components/general/SEO";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = lazy(() => import("@/components/general/Settings"));

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Listen for openSettings event from header
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
    };
    window.addEventListener('openSettings', handleOpenSettings);
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  useEffect(() => {
    // Load dateOfBirth from localStorage
    const savedDOB = localStorage.getItem('userDateOfBirth');
    if (savedDOB) {
      setDateOfBirth(savedDOB);
    }
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    if (dateOfBirth) {
      localStorage.setItem('userDateOfBirth', dateOfBirth);
      toast({
        title: "Profile updated",
        description: "Your date of birth has been saved.",
      });
    }
    setTimeout(() => setIsSaving(false), 300);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <SEO
        title="Profile"
        description="View and edit your profile"
        noindex={true}
      />
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Profile Settings</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-semibold" data-testid="text-user-name">
                {user.email || 'User'}
              </h2>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={user.email || ''} 
              disabled 
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input 
              id="dateOfBirth" 
              type="date" 
              value={dateOfBirth} 
              onChange={(e) => setDateOfBirth(e.target.value)}
              data-testid="input-date-of-birth"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            data-testid="button-save-profile"
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Account</h3>
          <p className="text-sm text-muted-foreground">
            All your data is stored locally in your browser. No account required.
          </p>
        </Card>
      </main>

      {/* Settings Dialog */}
      <Suspense fallback={<div />}>
        {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
      </Suspense>
    </div>
  );
}
