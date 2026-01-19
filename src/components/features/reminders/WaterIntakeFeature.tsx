import { useState, useEffect } from "react";
import { Droplets, Plus, X, Clock, Bell, ArrowLeft, Info, Target, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { colors } from "@/lib/designSystem";

interface WaterIntakeFeatureProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaterIntakeFeature({ isOpen, onClose }: WaterIntakeFeatureProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const [reminderMode, setReminderMode] = useState<'custom' | 'interval'>('interval');
  const [reminderInterval, setReminderInterval] = useState(2);
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  const [showAddTime, setShowAddTime] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Load settings on open
  useEffect(() => {
    if (!isOpen) return;
    
    const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
    const hasSetup = waterSettings.isSetupComplete || false;
    
    setIsSetupComplete(hasSetup);
    setShowSetup(false); // Don't auto-show setup form, show prompt first
    
    if (hasSetup) {
      setDailyGoal(waterSettings.dailyGoal || 2000);
    setUnit(waterSettings.unit || 'ml');
    setReminderMode(waterSettings.reminderMode || 'custom');
    setReminderInterval(waterSettings.reminderInterval || 2);
      setReminderTimes(waterSettings.reminderTimes || []);
    
      // Create reminders if enabled
      if (waterSettings.remindersEnabled && (waterSettings.reminderTimes?.length > 0 || waterSettings.reminderMode === 'interval')) {
        createWaterReminders(waterSettings);
      }
    }
  }, [isOpen]);

  // Listen for water entry updates to refresh reminder notes
  useEffect(() => {
    const handleWaterEntryAdded = () => {
      if (isSetupComplete) {
        const waterSettings = JSON.parse(localStorage.getItem('water_settings') || '{}');
        if (waterSettings.remindersEnabled) {
          createWaterReminders(waterSettings);
    }
      }
    };
    
    window.addEventListener('waterEntryAdded', handleWaterEntryAdded);
    return () => window.removeEventListener('waterEntryAdded', handleWaterEntryAdded);
  }, [isSetupComplete]);

  // Create water reminder tasks for timeline (for past 30 days and next 335 days)
  const createWaterReminders = (settings?: any) => {
    const waterSettings = settings || JSON.parse(localStorage.getItem('water_settings') || '{}');
    const dailyGoal = waterSettings.dailyGoal || 2000;
    const unit = waterSettings.unit || 'ml';
    const mode = waterSettings.reminderMode || 'custom';
    const times = waterSettings.reminderTimes || [];
    const interval = waterSettings.reminderInterval || 2;
    
    // Check for sleep schedule to get wake/sleep times
    const sleepSchedule = JSON.parse(localStorage.getItem('sleepSchedule') || 'null');
    let startHour = 6; // Default 6 AM
    let endHour = 22; // Default 10 PM
    
    if (sleepSchedule && sleepSchedule.wakeTime && sleepSchedule.bedtime) {
      // Use sleep schedule times
      const wakeTimeParts = sleepSchedule.wakeTime.split(':');
      const bedtimeParts = sleepSchedule.bedtime.split(':');
      startHour = parseInt(wakeTimeParts[0]) || 6;
      endHour = parseInt(bedtimeParts[0]) || 22;
    } else if (sleepSchedule && sleepSchedule.daily && sleepSchedule.daily.wakeTime && sleepSchedule.daily.sleepTime) {
      // Fallback to daily schedule
      const wakeTimeParts = sleepSchedule.daily.wakeTime.split(':');
      const sleepTimeParts = sleepSchedule.daily.sleepTime.split(':');
      startHour = parseInt(wakeTimeParts[0]) || 6;
      endHour = parseInt(sleepTimeParts[0]) || 22;
    }
    
    // Generate times based on mode
    let reminderTimesList: string[] = [];
    if (mode === 'custom') {
      reminderTimesList = times;
      if (reminderTimesList.length === 0) {
        return;
      }
      // Filter custom times to be within wake/sleep hours (strictly before bedtime)
      reminderTimesList = reminderTimesList.filter(time => {
        const timeParts = time.split(':');
        const timeHour = parseInt(timeParts[0]);
        const timeMinute = parseInt(timeParts[1] || '0');
        const timeTotalMinutes = timeHour * 60 + timeMinute;
        const endTotalMinutes = endHour * 60;
        const startTotalMinutes = startHour * 60;
        return timeTotalMinutes >= startTotalMinutes && timeTotalMinutes < endTotalMinutes;
      });
    } else {
      // Generate interval-based times between wake and sleep
      // Start AFTER wake up time (wake up + interval), not at wake up
      let firstReminderHour = startHour + interval;
      // Ensure first reminder doesn't exceed end hour
      if (firstReminderHour > endHour) {
        firstReminderHour = endHour;
      }
      for (let hour = firstReminderHour; hour <= endHour; hour += interval) {
        reminderTimesList.push(`${String(hour).padStart(2, '0')}:00`);
      }
    }
    
    const today = new Date();
    const tasks: any[] = [];
    const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
    
    // Remove existing water reminders
    const filteredTasks = existingTasks.filter((t: any) => 
      !(t.source === 'water' && t.waterReminder)
    );
    
    // Create reminders for past 30 days and next 335 days (365 total)
    for (let i = -30; i < 335; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      // Calculate intake for this date
      const waterEntries = JSON.parse(localStorage.getItem('water_entries') || '[]');
      const dateEntries = waterEntries.filter((entry: any) => {
        const entryDate = entry.date || (entry.timestamp ? new Date(entry.timestamp).toISOString().split('T')[0] : null);
        return entryDate === targetDateStr;
      });
      const currentIntake = dateEntries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
      const progressPercent = Math.round((currentIntake / dailyGoal) * 100);
      
      // Create reminders for each time
      reminderTimesList.forEach((time: string) => {
      tasks.push({
          id: `water_reminder_${targetDateStr}_${time.replace(':', '')}`,
        title: '💧 Drink Water',
          notes: `Today's intake: ${currentIntake}${unit} / ${dailyGoal}${unit} (${progressPercent}%)\nTap to log your water intake.`,
        time: time,
          dueDate: targetDateStr,
        completed: false,
        allDay: false,
        source: 'water',
        emoji: '💧',
          color: colors.features.water,
        waterReminder: true
      });
    });
    }
    
    localStorage.setItem('todos', JSON.stringify([...filteredTasks, ...tasks]));
    window.dispatchEvent(new Event('todosUpdated'));
  };

  const handleSetupComplete = () => {
    const waterSettings = {
      isSetupComplete: true,
      dailyGoal,
      unit,
      reminderMode,
      reminderInterval,
      reminderTimes,
      remindersEnabled: reminderTimes.length > 0 || reminderMode === 'interval'
    };
    
    localStorage.setItem('water_settings', JSON.stringify(waterSettings));
    setIsSetupComplete(true);
    setShowSetup(false);
    
    // Dispatch event to update feature lists
    window.dispatchEvent(new Event('waterSetupCompleted'));
    
    // Create reminders if enabled
    if (waterSettings.remindersEnabled) {
      createWaterReminders(waterSettings);
    }
  };

  const addReminderTime = () => {
    if (newReminderTime && !reminderTimes.includes(newReminderTime)) {
      const updated = [...reminderTimes, newReminderTime].sort();
      setReminderTimes(updated);
      setNewReminderTime('09:00');
      setShowAddTime(false);
    }
  };

  const removeReminderTime = (time: string) => {
    setReminderTimes(reminderTimes.filter(t => t !== time));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        {/* Header for when setup is complete */}
        {isSetupComplete && !showSetup && (
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5" style={{ color: colors.features.water }} />
                Water Intake
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
                        style={{ color: colors.features.water }}
                        onClick={() => {
                          setIsCollapsing(true);
                          setTimeout(() => {
                            setShowSetup(false);
                            setIsCollapsing(false);
                          }, 700);
                        }}
                      />
                      <span>{isSetupComplete ? 'Edit Water Settings' : 'Set up your Water Intake'}</span>
                    </>
                  ) : (
                    <>
                      <Droplets className="w-5 h-5" style={{ color: colors.features.water }} />
                      Water Intake
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
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <Droplets className="w-8 h-8" style={{ color: colors.features.water }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: colors.features.water }}>Set up your Water Intake</h3>
                <button
                  onClick={() => setShowSetup(true)}
                  className="mt-4 w-12 h-12 rounded-full backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/30 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  style={{ color: colors.features.water }}
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Setup Form Content */}
            {showSetup && (
              <div className="px-6 pb-6 animate-in fade-in duration-300">
                <div className="space-y-6">
                {/* Daily Goal - First Step */}
                <div className="space-y-3">
                  <Label htmlFor="daily-goal" className="text-base font-semibold block text-center">Daily Water Goal</Label>
                  <div className="flex items-center justify-center gap-2">
                    <Input
                      id="daily-goal"
                      type="number"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(parseInt(e.target.value) || 2000)}
                      placeholder="2000"
                      className="rounded-full w-32 text-center"
                    />
                    <Select 
                      value={unit} 
                      onValueChange={(value: 'ml' | 'oz') => setUnit(value)}
                    >
                      <SelectTrigger className="w-24 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Recommended: 2000ml (8 cups) per day
                  </p>
                  </div>
                  
                {/* Reminder Mode - Second Step */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold block text-center">Reminder Schedule</Label>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant={reminderMode === 'interval' ? 'default' : 'outline'}
                      onClick={() => setReminderMode('interval')}
                      className="rounded-full"
                    >
                      Every X Hours
                    </Button>
                    <Button
                      size="sm"
                      variant={reminderMode === 'custom' ? 'default' : 'outline'}
                      onClick={() => setReminderMode('custom')}
                      className="rounded-full"
                    >
                      Custom Times
                    </Button>
                  </div>
                  
                  {/* Custom Times */}
                  {reminderMode === 'custom' && (
                    <div className="space-y-3">
                  {reminderTimes.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                      {reminderTimes.map((time) => (
                            <div key={time} className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full border">
                              <Clock className="w-3 h-3" />
                              <span className="text-sm">{time}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive/10"
                            onClick={() => removeReminderTime(time)}
                          >
                                <X className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                      {showAddTime ? (
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="time"
                            value={newReminderTime}
                            onChange={(e) => setNewReminderTime(e.target.value)}
                            className="rounded-full w-32"
                          />
                          <Button size="sm" onClick={addReminderTime} className="rounded-full">
                            Add
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setShowAddTime(false);
                              setNewReminderTime('09:00');
                            }}
                            className="rounded-full"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                            onClick={() => setShowAddTime(true)}
                            className="rounded-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Reminder Time
                        </Button>
                        </div>
                      )}
                      {reminderTimes.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Add at least one reminder time to continue
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Interval Mode */}
                  {reminderMode === 'interval' && (
                          <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                              <Label htmlFor="reminder-interval" className="text-sm">Remind every:</Label>
                              <Select 
                                value={reminderInterval.toString()} 
                          onValueChange={(value) => setReminderInterval(parseInt(value))}
                              >
                          <SelectTrigger className="w-32 rounded-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 hour</SelectItem>
                                  <SelectItem value="2">2 hours</SelectItem>
                                  <SelectItem value="3">3 hours</SelectItem>
                                  <SelectItem value="4">4 hours</SelectItem>
                                  <SelectItem value="6">6 hours</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                      {(() => {
                        const sleepSchedule = JSON.parse(localStorage.getItem('sleepSchedule') || 'null');
                        let startHour = 6;
                        let endHour = 22;
                        
                        if (sleepSchedule && sleepSchedule.wakeTime && sleepSchedule.bedtime) {
                          const wakeTimeParts = sleepSchedule.wakeTime.split(':');
                          const bedtimeParts = sleepSchedule.bedtime.split(':');
                          startHour = parseInt(wakeTimeParts[0]) || 6;
                          endHour = parseInt(bedtimeParts[0]) || 22;
                        } else if (sleepSchedule && sleepSchedule.daily && sleepSchedule.daily.wakeTime && sleepSchedule.daily.sleepTime) {
                          const wakeTimeParts = sleepSchedule.daily.wakeTime.split(':');
                          const sleepTimeParts = sleepSchedule.daily.sleepTime.split(':');
                          startHour = parseInt(wakeTimeParts[0]) || 6;
                          endHour = parseInt(sleepTimeParts[0]) || 22;
                        }
                        
                        return (
                          <p className="text-xs text-muted-foreground p-2 bg-muted rounded-full text-center">
                            Reminders will be set from {String(startHour).padStart(2, '0')}:00 to {String(endHour).padStart(2, '0')}:00
                            {sleepSchedule ? ' (based on your sleep schedule)' : ''}
                          </p>
                        );
                      })()}
                          </div>
                  )}
                </div>
                        
                {/* Save Button */}
                <div className="pt-4 flex flex-col items-center">
                  {(() => {
                    const isCustomModeValid = reminderMode === 'interval' || (reminderMode === 'custom' && reminderTimes.length > 0);
                    const isDailyGoalValid = dailyGoal > 0;
                    const isValid = isCustomModeValid && isDailyGoalValid;
                    
                    return (
                      <>
                        <Button 
                          className="rounded-full px-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground" 
                          onClick={handleSetupComplete}
                          disabled={!isValid}
                        >
                          {isSetupComplete ? 'Save Changes' : 'Complete Setup'}
                        </Button>
                        {!isValid && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            {reminderMode === 'custom' && reminderTimes.length === 0 
                              ? 'Please add at least one reminder time'
                              : !isDailyGoalValid 
                              ? 'Please set a daily water goal'
                              : 'Please fill in all required fields'}
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
        {isSetupComplete && !showSetup && (() => {
          // Calculate today's intake
          const waterEntries = JSON.parse(localStorage.getItem('water_entries') || '[]');
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          const todayEntries = waterEntries.filter((entry: any) => {
            if (entry.timestamp) {
              return new Date(entry.timestamp).toDateString() === today.toDateString();
            }
            if (entry.date) {
              return entry.date === todayStr;
            }
            return false;
          });
          const totalIntake = todayEntries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
          const goalReached = totalIntake >= dailyGoal;
          
          const markAllWaterTasksDone = () => {
            if (!goalReached) return;
            const todos = JSON.parse(localStorage.getItem('todos') || '[]');
            const updatedTodos = todos.map((task: any) => {
              if (task.source === 'water' && (task as any).waterReminder && task.dueDate === todayStr) {
                return { ...task, completed: true };
              }
              return task;
            });
            localStorage.setItem('todos', JSON.stringify(updatedTodos));
            window.dispatchEvent(new Event('todosUpdated'));
          };
          
          return (
            <div className="px-6 py-6 space-y-4">
              <div className="p-4 rounded-2xl border bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Daily Goal</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {dailyGoal}{unit}
                </div>
                {goalReached && (
                  <Button
                    size="sm"
                    className="mt-3 w-full rounded-full"
                    onClick={markAllWaterTasksDone}
                  >
                    Mark All Water Tasks as Done
                  </Button>
                )}
              </div>

            <div className="p-4 rounded-2xl border bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Reminders</span>
                </div>
              </div>
              {reminderMode === 'custom' && reminderTimes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {reminderTimes.map((time) => (
                    <div key={time} className="flex items-center gap-1 bg-background px-2 py-1 rounded-full border text-sm">
                      <Clock className="w-3 h-3" />
                      {time}
                    </div>
                  ))}
                </div>
              )}
              {reminderMode === 'interval' && (
                <div className="text-sm mt-2">
                  Every {reminderInterval} hour{reminderInterval > 1 ? 's' : ''} (8 AM - 10 PM)
                </div>
          )}
        </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
