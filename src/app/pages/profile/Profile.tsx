import { useState, useEffect } from "react";
import { SEO } from "@/app/components/shared/SEO";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dateOfBirth, setDateOfBirth] = useState("");

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

  useEffect(() => {
    // Load dateOfBirth from localStorage
    const savedDOB = localStorage.getItem('userDateOfBirth');
    if (savedDOB) {
      setDateOfBirth(savedDOB);
    }
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { dateOfBirth: string }) => {
      return await apiRequest("PATCH", "/api/auth/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (dateOfBirth) {
      localStorage.setItem('userDateOfBirth', dateOfBirth);
      toast({
        title: "Profile updated",
        description: "Your date of birth has been saved.",
      });
    }
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
          onClick={() => setLocation("/")}
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
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-profile"
            className="w-full"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Account</h3>
          <p className="text-sm text-muted-foreground">
            Password and authentication settings are managed through your account provider (Google, Apple, or email).
          </p>
          <Button 
            variant="destructive" 
            asChild 
            className="w-full"
            data-testid="button-logout"
          >
            <a href="/api/logout">Sign Out</a>
          </Button>
        </Card>
      </main>
    </div>
  );
}
