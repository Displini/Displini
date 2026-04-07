import { useState, useEffect } from "react";
import { GraduationCap, Clock, BookOpen, Calendar, Plus, Edit, Trash2, CheckCircle, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { colors } from "@/lib/designSystem";
import { EmojiPicker } from "@/components/general/EmojiPicker";

interface SchoolSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  semester: string;
  isActive: boolean;
  emoji?: string;
  color?: string;
}

interface SchoolFeatureProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchoolFeature({ isOpen, onClose }: SchoolFeatureProps) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<SchoolSchedule | null>(null);

  const [schedules, setSchedules] = useState<SchoolSchedule[]>([]);
  
  // Check if setup is complete (has at least one schedule)
  const isSetupComplete = schedules.length > 0;

  // Load school schedules from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('school_schedules');
    if (saved) {
      setSchedules(JSON.parse(saved));
    }
  }, [isOpen]);

  const [newSchedule, setNewSchedule] = useState({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    days: [] as string[],
    semester: 'Fall 2024',
    isActive: true,
    emoji: '🎓',
    color: colors.features.school || '#FFD400',
  });

  const addSchedule = () => {
    if (newSchedule.name.trim()) {
      const schedule: SchoolSchedule = {
        id: Date.now().toString(),
        ...newSchedule,
        isActive: true,
        emoji: newSchedule.emoji || '🎓',
        color: newSchedule.color || schoolColor,
      };
      
      const updated = [...schedules, schedule];
      setSchedules(updated);
      localStorage.setItem('school_schedules', JSON.stringify(updated));
      window.dispatchEvent(new Event('schoolSchedulesUpdated'));
      
      setNewSchedule({
        name: '',
        startTime: '08:00',
        endTime: '16:00',
        days: [],
        semester: 'Fall 2024',
        isActive: true,
        emoji: '🎓',
        color: schoolColor,
      });
      setShowAddSchedule(false);
    }
  };

  const editSchedule = (schedule: SchoolSchedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      name: schedule.name,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      days: schedule.days,
      semester: schedule.semester,
      isActive: schedule.isActive,
      emoji: schedule.emoji || '🎓',
      color: schedule.color || schoolColor,
    });
    setIsSetupOpen(true);
    setShowEditSchedule(true);
  };

  const updateSchedule = () => {
    if (editingSchedule && newSchedule.name.trim()) {
      const updated = schedules.map(schedule => 
        schedule.id === editingSchedule.id 
          ? { ...schedule, ...newSchedule, emoji: newSchedule.emoji || '🎓', color: newSchedule.color || schoolColor }
          : schedule
      );
      setSchedules(updated);
      localStorage.setItem('school_schedules', JSON.stringify(updated));
      window.dispatchEvent(new Event('schoolSchedulesUpdated'));
      setIsSetupOpen(false);
      setShowEditSchedule(false);
      setEditingSchedule(null);
      setNewSchedule({
        name: '',
        startTime: '08:00',
        endTime: '16:00',
        days: [],
        semester: 'Fall 2024',
        isActive: true,
        emoji: '🎓',
        color: schoolColor,
      });
    }
  };

  const deleteSchedule = (id: string) => {
    const updated = schedules.filter(schedule => schedule.id !== id);
    setSchedules(updated);
    localStorage.setItem('school_schedules', JSON.stringify(updated));
    window.dispatchEvent(new Event('schoolSchedulesUpdated'));
  };

  const toggleSchedule = (id: string) => {
    const updated = schedules.map(schedule => 
      schedule.id === id ? { ...schedule, isActive: !schedule.isActive } : schedule
    );
    setSchedules(updated);
    localStorage.setItem('school_schedules', JSON.stringify(updated));
    window.dispatchEvent(new Event('schoolSchedulesUpdated'));
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daysLower = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const schoolColor = colors.features.school || '#FFD400';

  // Setup Flow
  if (!isSetupComplete && !isSetupOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
          <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
              <GraduationCap className="w-8 h-8" style={{ color: schoolColor }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: schoolColor }}>Set up your School Schedule</h3>
            <p className="text-sm text-muted-foreground mb-6">Add your classes and academic schedule</p>
            <button
              onClick={() => setIsSetupOpen(true)}
              className="mt-4 w-12 h-12 rounded-full backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/30 flex items-center justify-center transition-all shadow-lg hover:scale-110"
              style={{ color: schoolColor }}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" style={{ color: schoolColor }} />
            School & Academic
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
              {isSetupComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSetupOpen(true)}
                  className="rounded-full h-9 px-3"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Schedule
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Setup Form */}
        {isSetupOpen && (
          <div className="px-6 pb-6 animate-in fade-in duration-300">
            {!isSetupComplete && (
              <div className="pt-6 border-b pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <ArrowLeft 
                      className="w-4 h-4 cursor-pointer" 
                      style={{ color: schoolColor }}
                      onClick={() => setIsSetupOpen(false)}
                    />
                    <span>Set up your School Schedule</span>
                  </DialogTitle>
                </div>
              </div>
            )}
        
        <div className="space-y-6">
              {/* Emoji */}
              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">Schedule Emoji</Label>
                <EmojiPicker 
                  value={newSchedule.emoji || '🎓'} 
                  onChange={(emoji) => setNewSchedule({...newSchedule, emoji})}
                  category="school"
                />
              </Card>
              
              <Card className="p-4 rounded-2xl">
                <Label htmlFor="schedule-name" className="text-base font-semibold mb-3 block">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                  placeholder="e.g., University Classes"
                  className="rounded-full"
                />
              </Card>
              
              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">School Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                      className="mt-2 rounded-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time" className="text-sm">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
                      className="mt-2 rounded-full"
                    />
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 rounded-2xl">
                <Label htmlFor="semester" className="text-base font-semibold mb-3 block">Semester</Label>
                <Input
                  id="semester"
                  value={newSchedule.semester}
                  onChange={(e) => setNewSchedule({...newSchedule, semester: e.target.value})}
                  placeholder="e.g., Fall 2024"
                  className="rounded-full"
                />
              </Card>
              
              <Card className="p-4 rounded-2xl">
                <Label className="text-base font-semibold mb-3 block">School Days</Label>
                <div className="grid grid-cols-2 gap-3">
                  {daysLower.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={newSchedule.days.includes(day)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewSchedule({...newSchedule, days: [...newSchedule.days, day]});
                          } else {
                            setNewSchedule({...newSchedule, days: newSchedule.days.filter(d => d !== day)});
                          }
                        }}
                      />
                      <Label htmlFor={day} className="cursor-pointer capitalize text-sm">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </Card>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    if (showEditSchedule && editingSchedule) {
                      updateSchedule();
                    } else {
                      addSchedule();
                      setIsSetupOpen(false);
                      setNewSchedule({
                        name: '',
                        startTime: '08:00',
                        endTime: '16:00',
                        days: [],
                        semester: 'Fall 2024',
                        isActive: true,
                        emoji: '🎓',
                        color: schoolColor,
                      });
                    }
                  }} 
                  className="flex-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  disabled={!newSchedule.name.trim() || newSchedule.days.length === 0 || !newSchedule.startTime || !newSchedule.endTime}
                >
                  {showEditSchedule ? 'Update Schedule' : (isSetupComplete ? 'Add Schedule' : 'Complete Setup')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsSetupOpen(false);
                    setShowEditSchedule(false);
                    setEditingSchedule(null);
                    setNewSchedule({
                      name: '',
                      startTime: '08:00',
                      endTime: '16:00',
                      days: [],
                      semester: 'Fall 2024',
                      isActive: true,
                      emoji: '🎓',
                      color: schoolColor,
                    });
                  }}
                  className="flex-1 rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main View */}
        {!isSetupOpen && isSetupComplete && (
          <div className="px-6 pb-6 space-y-6">
            {/* Header Stats */}
            <div className="flex justify-between items-center pt-4">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{schedules.length}</p>
                  <p className="text-sm text-muted-foreground">Schedules</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {schedules.filter(s => s.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </div>

          {/* School Schedules */}
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No school schedules added yet</p>
                <p className="text-sm">Add your first school schedule to get started</p>
              </div>
            ) : (
              schedules.map((schedule) => (
                <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{schedule.emoji || '🎓'}</span>
                          <h3 className="font-medium">{schedule.name}</h3>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            schedule.isActive 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{schedule.startTime} - {schedule.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{schedule.semester}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            Days: {schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editSchedule(schedule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSchedule(schedule.id)}
                        >
                          <CheckCircle className={`w-4 h-4 ${schedule.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
                  </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
