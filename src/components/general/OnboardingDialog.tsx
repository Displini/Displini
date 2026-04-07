import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

interface UserProfile {
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  dateOfBirth: string;
  height: number;
  heightUnit: 'cm' | 'ft';
  weight: number;
  weightUnit: 'kg' | 'lbs';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  wakeTime: string;
  sleepTime: string;
  mainPurpose: string[];
  workStatus: 'student' | 'working' | 'both' | 'prefer-not-to-say';
  onboardingCompleted: boolean;
}

const defaultProfile: UserProfile = {
  gender: 'prefer-not-to-say',
  dateOfBirth: '',
  height: 170,
  heightUnit: 'cm',
  weight: 70,
  weightUnit: 'kg',
  activityLevel: 'moderate',
  wakeTime: '07:00',
  sleepTime: '23:00',
  mainPurpose: [],
  workStatus: 'prefer-not-to-say',
  onboardingCompleted: false,
};

export default function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    // Check if user has completed onboarding
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      const savedProfile = JSON.parse(saved);
      if (savedProfile.onboardingCompleted) {
        setOpen(false);
        return;
      }
    }
    // Show onboarding for first-time users
    setOpen(true);
  }, []);

  const handleSave = () => {
    const completedProfile = { ...profile, onboardingCompleted: true };
    localStorage.setItem('userProfile', JSON.stringify(completedProfile));
    
    // If gender is male, disable pregnancy and menstrual cycle by default
    if (profile.gender === 'male') {
      const healthSections = JSON.parse(localStorage.getItem('healthEnabledSections') || '{}');
      healthSections.pregnancy = false;
      healthSections.cycle = false;
      localStorage.setItem('healthEnabledSections', JSON.stringify(healthSections));
    }
    
    // Set sleep schedule if provided and create sleep tasks
    if (profile.wakeTime && profile.sleepTime) {
      const sleepSchedule = {
        id: 'default',
        mode: 'daily',
        daily: {
          wakeTime: profile.wakeTime,
          sleepTime: profile.sleepTime,
        },
        alarmEnabled: true,
        alarmSound: 'gentle'
      };
      localStorage.setItem('sleepSchedule', JSON.stringify(sleepSchedule));
      
      // Create sleep tasks in todos
      const todos = JSON.parse(localStorage.getItem("todos") || "[]");
      const filteredTodos = todos.filter((t: any) => t.source !== 'sleep');
      
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      
      // Create sleep tasks for the next 30 days
      for (let i = 0; i < 30; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        
        const wakeTodo = {
          id: `sleep-wake-${targetDate.toISOString().split('T')[0]}`,
          title: '⏰ Wake up',
          completed: false,
          dueDate: targetDate.toISOString(),
          time: profile.wakeTime,
          source: 'sleep',
          sleepAction: 'wake',
        };
        
        const sleepTodo = {
          id: `sleep-bed-${targetDate.toISOString().split('T')[0]}`,
          title: '🌙 Go to bed',
          completed: false,
          dueDate: targetDate.toISOString(),
          time: profile.sleepTime,
          source: 'sleep',
          sleepAction: 'sleep',
        };
        
        filteredTodos.push(wakeTodo, sleepTodo);
      }
      
      localStorage.setItem("todos", JSON.stringify(filteredTodos));
    }
    
    setOpen(false);
    window.location.reload(); // Reload to apply changes
  };

  const handleSkip = () => {
    const skippedProfile = { ...defaultProfile, onboardingCompleted: true };
    localStorage.setItem('userProfile', JSON.stringify(skippedProfile));
    setOpen(false);
  };

  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Welcome to Displini
          </DialogTitle>
          <DialogDescription>
            Let's personalize your experience. You can skip this and set it up later in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Progress indicator */}
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? 'w-8 bg-primary' : s < step ? 'w-2 bg-primary/50' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              
              <div>
                <Label>Gender</Label>
                <RadioGroup value={profile.gender} onValueChange={(v: any) => setProfile({...profile, gender: v})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say" />
                    <Label htmlFor="prefer-not-to-say">Prefer not to say</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Date of Birth</Label>
                <Input 
                  type="date" 
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Height</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={profile.height}
                      onChange={(e) => setProfile({...profile, height: parseFloat(e.target.value) || 0})}
                      className="flex-1"
                    />
                    <Select value={profile.heightUnit} onValueChange={(v: any) => setProfile({...profile, heightUnit: v})}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Weight</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={profile.weight}
                      onChange={(e) => setProfile({...profile, weight: parseFloat(e.target.value) || 0})}
                      className="flex-1"
                    />
                    <Select value={profile.weightUnit} onValueChange={(v: any) => setProfile({...profile, weightUnit: v})}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Activity & Sleep */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Lifestyle</h3>
              
              <div>
                <Label>Activity Level</Label>
                <Select value={profile.activityLevel} onValueChange={(v: any) => setProfile({...profile, activityLevel: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (Little to no exercise)</SelectItem>
                    <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (Athlete level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Are you currently...</Label>
                <RadioGroup value={profile.workStatus} onValueChange={(v: any) => setProfile({...profile, workStatus: v})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student">🎓 A student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="working" id="working" />
                    <Label htmlFor="working">💼 Working</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">🎓💼 Both student and working</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say-work" />
                    <Label htmlFor="prefer-not-to-say-work">Prefer not to say</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Wake Time</Label>
                  <Input 
                    type="time" 
                    value={profile.wakeTime}
                    onChange={(e) => setProfile({...profile, wakeTime: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Sleep Time</Label>
                  <Input 
                    type="time" 
                    value={profile.sleepTime}
                    onChange={(e) => setProfile({...profile, sleepTime: e.target.value})}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                We'll use this to set up your daily timeline and calculate your recommended calorie intake.
              </p>
            </div>
          )}

          {/* Step 3: Main Purpose */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">What's your main focus?</h3>
              <p className="text-sm text-muted-foreground">Select all that apply. We'll prioritize these features for you.</p>
              
              <div className="space-y-3">
                {[
                  { id: 'scheduling', label: 'Daily Planning & Scheduling', emoji: '📅' },
                  { id: 'sports', label: 'Fitness & Workouts', emoji: '💪' },
                  { id: 'health', label: 'Health Tracking', emoji: '❤️' },
                  { id: 'nutrition', label: 'Nutrition & Meal Planning', emoji: '🍽️' },
                ].map(purpose => (
                  <div key={purpose.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={purpose.id}
                      checked={profile.mainPurpose.includes(purpose.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProfile({...profile, mainPurpose: [...profile.mainPurpose, purpose.id]});
                        } else {
                          setProfile({...profile, mainPurpose: profile.mainPurpose.filter(p => p !== purpose.id)});
                        }
                      }}
                    />
                    <Label htmlFor={purpose.id} className="flex items-center gap-2 cursor-pointer flex-1">
                      <span className="text-2xl">{purpose.emoji}</span>
                      <span>{purpose.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={handleSkip}
            >
              Skip for now
            </Button>

            <div className="flex gap-2">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(step - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSave}>
                  Get Started
                  <Sparkles className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

