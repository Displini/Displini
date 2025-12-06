import { useState, useEffect } from "react";
import { Utensils, Plus, X, Target, Edit, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { colors } from "@/lib/designSystem";

interface FoodTrackerFeatureProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FoodTrackerFeature({ isOpen, onClose }: FoodTrackerFeatureProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(150);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Load settings on open
  useEffect(() => {
    if (!isOpen) return;
    
    const foodSettings = JSON.parse(localStorage.getItem('food_settings') || '{}');
    const hasSetup = foodSettings.isSetupComplete || false;
    
    setIsSetupComplete(hasSetup);
    setShowSetup(false);
    
    if (hasSetup) {
      setCalorieGoal(foodSettings.calorieGoal || 2000);
      setProteinGoal(foodSettings.proteinGoal || 150);
    }
  }, [isOpen]);

  const handleSetupComplete = () => {
    const foodSettings = {
      isSetupComplete: true,
      calorieGoal,
      proteinGoal
    };
    
    localStorage.setItem('food_settings', JSON.stringify(foodSettings));
    setIsSetupComplete(true);
    setShowSetup(false);
    window.dispatchEvent(new Event('foodSettingsUpdated'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        {/* Header for when setup is complete */}
        {isSetupComplete && !showSetup && (
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" style={{ color: colors.features.food || '#f59e0b' }} />
                Food Tracker
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSetup(true)}
                  className="rounded-full h-9 px-3"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Combined Initial Setup and Expand Form */}
        {(!isSetupComplete || showSetup) && (
          <div className={`transition-all duration-700 ease-in-out overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${showSetup || isCollapsing ? 'min-h-[600px]' : ''}`}>
            <div className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  {showSetup ? (
                    <>
                      <ArrowLeft 
                        className="w-4 h-4 cursor-pointer" 
                        style={{ color: colors.features.food || '#f59e0b' }}
                        onClick={() => {
                          setIsCollapsing(true);
                          setTimeout(() => {
                            setShowSetup(false);
                            setIsCollapsing(false);
                          }, 700);
                        }}
                      />
                      <span>{isSetupComplete ? 'Edit Food Settings' : 'Set up your Food Tracker'}</span>
                    </>
                  ) : (
                    <>
                      <Utensils className="w-5 h-5" style={{ color: colors.features.food || '#f59e0b' }} />
                      Food Tracker
                    </>
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onClose}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
              
            {!showSetup && (
              <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Utensils className="w-8 h-8" style={{ color: colors.features.food || '#f59e0b' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: colors.features.food || '#f59e0b' }}>Set up your Food Tracker</h3>
                <button
                  onClick={() => setShowSetup(true)}
                  className="mt-4 w-12 h-12 rounded-full backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/30 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  style={{ color: colors.features.food || '#f59e0b' }}
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Setup Form Content */}
            {showSetup && (
              <div className="px-6 pb-6 animate-in fade-in duration-300">
                <div className="space-y-6">
                {/* Daily Calorie Goal */}
                <div className="space-y-3">
                  <Label htmlFor="calorie-goal" className="text-base font-semibold block text-center">Daily Calorie Goal</Label>
                  <div className="flex items-center justify-center">
                    <Input
                      id="calorie-goal"
                      type="number"
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 2000)}
                      placeholder="2000"
                      className="rounded-full w-32 text-center"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Recommended: 2000-2500 kcal per day
                  </p>
                </div>

                {/* Daily Protein Goal */}
                <div className="space-y-3">
                  <Label htmlFor="protein-goal" className="text-base font-semibold block text-center">Daily Protein Goal (g)</Label>
                  <div className="flex items-center justify-center">
                    <Input
                      id="protein-goal"
                      type="number"
                      value={proteinGoal}
                      onChange={(e) => setProteinGoal(parseInt(e.target.value) || 150)}
                      placeholder="150"
                      className="rounded-full w-32 text-center"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Recommended: 150-200g per day
                  </p>
                </div>

                {/* Save Button */}
                <div className="pt-4 flex flex-col items-center">
                  {(() => {
                    const isValid = calorieGoal > 0 && proteinGoal > 0;
                    
                    return (
                      <>
                        <Button 
                          className="rounded-full px-8 disabled:opacity-50 disabled:cursor-not-allowed" 
                          onClick={handleSetupComplete}
                          disabled={!isValid}
                        >
                          {isSetupComplete ? 'Save Changes' : 'Complete Setup'}
                        </Button>
                        {!isValid && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Please fill in all required fields (calorie and protein goals)
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Overview when setup complete */}
        {isSetupComplete && !showSetup && (
          <div className="px-6 py-6 space-y-4">
            <div className="p-4 rounded-2xl border bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Daily Calorie Goal</span>
                </div>
              </div>
              <div className="text-2xl font-bold">
                {calorieGoal} kcal
              </div>
            </div>

            <div className="p-4 rounded-2xl border bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Daily Protein Goal</span>
                </div>
              </div>
              <div className="text-2xl font-bold">
                {proteinGoal} g
              </div>
            </div>

            <Button
              className="w-full rounded-full"
              onClick={() => {
                // Open food logging - could navigate to food page or open a dialog
                window.location.href = '/';
              }}
            >
              Log Food Intake
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

