import { useState, useEffect } from "react";
import { Pill, Plus, CheckCircle, Clock, Edit, Trash2, X, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmojiPicker } from "@/components/general/EmojiPicker";
import { colors } from "@/lib/designSystem";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: 'once' | 'twice' | 'three_times' | 'four_times' | 'as_needed';
  times: string[];
  allDay: boolean;
  isActive: boolean;
  color: string;
  emoji: string;
}

interface MedicationTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicationTracker({ isOpen, onClose }: MedicationTrackerProps) {
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showEditTime, setShowEditTime] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editingMode, setEditingMode] = useState(false);
  const [newTime, setNewTime] = useState('08:00');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'once' as 'once' | 'twice' | 'three_times' | 'four_times' | 'as_needed',
    times: [] as string[],
    allDay: false,
    color: '#3b82f6',
    emoji: '💊'
  });

  // Load medications from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('medications');
    if (saved) {
      setMedications(JSON.parse(saved));
    }
  }, [isOpen]);

  // Auto-populate times when frequency changes
  useEffect(() => {
    if (showAddMedication && newMedication.frequency !== 'as_needed' && newMedication.times.length === 0) {
      const timesMap: Record<string, string[]> = {
        'once': ['08:00'],
        'twice': ['08:00', '20:00'],
        'three_times': ['08:00', '14:00', '20:00'],
        'four_times': ['08:00', '12:00', '16:00', '20:00']
      };
      setNewMedication({
        ...newMedication,
        times: timesMap[newMedication.frequency] || ['08:00']
      });
    }
  }, [newMedication.frequency, showAddMedication]);

  const addMedication = () => {
    if (newMedication.name.trim() && newMedication.dosage.trim()) {
      if (editingMode && editingMedication) {
        // Update existing medication
        const updated = medications.map(med => 
          med.id === editingMedication.id
            ? { ...med, ...newMedication }
            : med
        );
        setMedications(updated);
        localStorage.setItem('medications', JSON.stringify(updated));
        
        // Update timeline tasks
        if (!newMedication.allDay && newMedication.times.length > 0) {
          createMedicationTasks({ ...editingMedication, ...newMedication });
        } else if (newMedication.allDay) {
          createAllDayMedicationTask({ ...editingMedication, ...newMedication });
        }
        
        setEditingMode(false);
        setEditingMedication(null);
      } else {
        // Add new medication
        const medication: Medication = {
          id: Date.now().toString(),
          ...newMedication,
          isActive: true
        };
        
        const updated = [...medications, medication];
        setMedications(updated);
        localStorage.setItem('medications', JSON.stringify(updated));
        
        // Create timeline tasks if active and has times
        if (!medication.allDay && medication.times.length > 0) {
          createMedicationTasks(medication);
        } else if (medication.allDay) {
          createAllDayMedicationTask(medication);
        }
      }
      
      setNewMedication({
        name: '',
        dosage: '',
        frequency: 'once',
        times: [],
        allDay: false,
        color: '#3b82f6',
        emoji: '💊'
      });
      setShowAddMedication(false);
    }
  };

  const startEditing = (medication: Medication) => {
    setEditingMedication(medication);
    setEditingMode(true);
    setNewMedication({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      times: medication.times,
      allDay: medication.allDay,
      color: medication.color,
      emoji: medication.emoji
    });
    setShowAddMedication(true);
  };

  const createMedicationTasks = (medication: Medication) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tasks: any[] = [];
    const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
    
    // Remove existing medication tasks for this medication (for all dates)
    const filteredTasks = existingTasks.filter((t: any) => 
      !(t.source === 'medication' && t.medicationId === medication.id && !t.allDay)
    );
    
    // Create medication tasks for the past 30 days and next 335 days (365 total)
    for (let i = -30; i < 335; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      medication.times.forEach((time) => {
        tasks.push({
          id: `medication_${medication.id}_${targetDateStr}_${time.replace(':', '')}`,
          title: `${medication.emoji} ${medication.name}`,
          notes: `Take ${medication.dosage}`,
          time: time,
          dueDate: targetDateStr,
          completed: false,
          allDay: false,
          source: 'medication',
          medicationId: medication.id,
          emoji: medication.emoji,
          color: medication.color
        });
      });
    }
    
    localStorage.setItem('todos', JSON.stringify([...filteredTasks, ...tasks]));
    window.dispatchEvent(new Event('todosUpdated'));
  };

  const createAllDayMedicationTask = (medication: Medication) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
    
    // Remove existing all-day medication tasks for this medication
    const filteredTasks = existingTasks.filter((t: any) => 
      !(t.source === 'medication' && t.medicationId === medication.id && t.allDay)
    );
    
    // Create tasks for the past 30 days and next 335 days (365 total)
    const tasks = [];
    for (let i = -30; i < 335; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      tasks.push({
        id: `medication_allday_${medication.id}_${targetDateStr}`,
        title: `${medication.emoji} ${medication.name}`,
        notes: `Take ${medication.dosage}`,
        dueDate: targetDateStr,
        completed: false,
        allDay: true,
        source: 'medication',
        medicationId: medication.id,
        emoji: medication.emoji,
        color: medication.color
      });
    }
    
    localStorage.setItem('todos', JSON.stringify([...filteredTasks, ...tasks]));
    window.dispatchEvent(new Event('todosUpdated'));
  };

  const addTimeToMedication = () => {
    if (!editingMedication || !newTime) return;
    
    const updated = medications.map(med => 
      med.id === editingMedication.id
        ? { ...med, times: [...med.times, newTime].sort() }
        : med
    );
    setMedications(updated);
    localStorage.setItem('medications', JSON.stringify(updated));
    
    // Recreate tasks if active
    const updatedMed = updated.find(m => m.id === editingMedication.id);
    if (updatedMed && updatedMed.isActive && !updatedMed.allDay) {
      createMedicationTasks(updatedMed);
    }
    
    setShowEditTime(false);
    setNewTime('08:00');
  };

  const removeTimeFromMedication = (medId: string, time: string) => {
    const updated = medications.map(med => 
      med.id === medId
        ? { ...med, times: med.times.filter(t => t !== time) }
        : med
    );
    setMedications(updated);
    localStorage.setItem('medications', JSON.stringify(updated));
    
    // Recreate tasks if active
    const updatedMed = updated.find(m => m.id === medId);
    if (updatedMed && updatedMed.isActive && !updatedMed.allDay) {
      createMedicationTasks(updatedMed);
    }
  };

  const toggleMedication = (id: string) => {
    const medication = medications.find(m => m.id === id);
    if (!medication) return;
    
    const updated = medications.map(med => 
      med.id === id ? { ...med, isActive: !med.isActive } : med
    );
    setMedications(updated);
    localStorage.setItem('medications', JSON.stringify(updated));
    
    // Create or remove tasks based on active state
    if (!medication.isActive) {
      // Being enabled
      const updatedMed = updated.find(m => m.id === id);
      if (updatedMed) {
        if (updatedMed.allDay) {
          createAllDayMedicationTask(updatedMed);
        } else if (updatedMed.times.length > 0) {
          createMedicationTasks(updatedMed);
        }
      }
    } else {
      // Being disabled - remove tasks
      const today = new Date().toISOString().split('T')[0];
      const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTasks = existingTasks.filter((t: any) => 
        !(t.dueDate === today && t.source === 'medication' && t.medicationId === id)
      );
      localStorage.setItem('todos', JSON.stringify(filteredTasks));
      window.dispatchEvent(new Event('todosUpdated'));
    }
  };

  const deleteMedication = (id: string) => {
    const updated = medications.filter(med => med.id !== id);
    setMedications(updated);
    localStorage.setItem('medications', JSON.stringify(updated));
    
    // Remove tasks for this medication
    const today = new Date().toISOString().split('T')[0];
    const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
    const filteredTasks = existingTasks.filter((t: any) => 
      !(t.dueDate === today && t.source === 'medication' && t.medicationId === id)
    );
    localStorage.setItem('todos', JSON.stringify(filteredTasks));
    window.dispatchEvent(new Event('todosUpdated'));
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'once': return 'Once daily';
      case 'twice': return 'Twice daily';
      case 'three_times': return 'Three times daily';
      case 'four_times': return 'Four times daily';
      case 'as_needed': return 'As needed';
      default: return 'Once daily';
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        {/* Header for when medications exist */}
        {medications.length > 0 && !showAddMedication && (
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" style={{ color: colors.features.medication }} />
                Medication Reminder
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowInfo(true)}
                  aria-label="Show information"
                >
                  <Info className="h-4 w-4" />
                </Button>
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
                  onClick={() => setShowAddMedication(true)}
                  className="rounded-full h-9 w-9 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Combined Initial Setup and Expand Form */}
        {(medications.length === 0 || showAddMedication) && (
          <div className={`transition-all duration-700 ease-in-out overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${showAddMedication || isCollapsing ? 'min-h-[600px]' : ''}`}>
            <div className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  {showAddMedication ? (
                    <>
                      <ArrowLeft 
                        className="w-4 h-4 text-green-600 cursor-pointer" 
                        onClick={() => {
                          setIsCollapsing(true);
                          setTimeout(() => {
                            setShowAddMedication(false);
                            setIsCollapsing(false);
                            setEditingMode(false);
                            setEditingMedication(null);
                          }, 700);
                        }}
                      />
                      <span>{editingMode ? 'Edit Medication' : 'Add Medication'}</span>
                    </>
                  ) : (
                    <>
                      <Pill className="w-5 h-5 text-green-600" />
                      Medication Reminder
                    </>
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowInfo(true)}
                    aria-label="Show information"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
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
              
              {!showAddMedication && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <Pill className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-green-900">Set up your Medication reminder</h3>
                  <button
                    onClick={() => setShowAddMedication(true)}
                    className="mt-4 w-12 h-12 rounded-full backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/30 text-green-900 flex items-center justify-center mx-auto transition-all shadow-lg hover:scale-110"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* Add Medication Form - Appears with stretch animation */}
              {showAddMedication && (
                <div className="space-y-4 px-6 pb-6 animate-in fade-in duration-300">
                <div>
                  <Label htmlFor="med-name">Medication Name</Label>
                  <Input
                    id="med-name"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                    placeholder="e.g., Vitamin D"
                    className="rounded-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="med-dosage">Dosage</Label>
                  <Input
                    id="med-dosage"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                    placeholder="e.g., 1000 IU"
                    className="rounded-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="med-emoji">Emoji</Label>
                                      <EmojiPicker 
                      value={newMedication.emoji} 
                      onChange={(emoji) => setNewMedication({...newMedication, emoji})}
                      category="medication"
                    />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-full">
                  <Label htmlFor="med-allday">All Day Task</Label>
                  <Switch
                    id="med-allday"
                    checked={newMedication.allDay}
                    onCheckedChange={(checked) => setNewMedication({...newMedication, allDay: checked})}
                  />
                </div>
                
                {!newMedication.allDay && (
                  <>
                    <div>
                      <Label>Frequency (times per day)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newFreq = newMedication.frequency === 'once' ? 1 : 
                                          newMedication.frequency === 'twice' ? 2 :
                                          newMedication.frequency === 'three_times' ? 3 : 4;
                            if (newFreq > 1) {
                              const freqMap = { 1: 'once', 2: 'twice', 3: 'three_times', 4: 'four_times' };
                              const timesMap: Record<string, string[]> = {
                                'once': ['08:00'],
                                'twice': ['08:00', '20:00'],
                                'three_times': ['08:00', '14:00', '20:00'],
                                'four_times': ['08:00', '12:00', '16:00', '20:00']
                              };
                              const newFrequency = freqMap[(newFreq - 1) as keyof typeof freqMap];
                              setNewMedication({
                                ...newMedication,
                                frequency: newFrequency as 'once' | 'twice' | 'three_times' | 'four_times',
                                times: timesMap[newFrequency] || ['08:00']
                              });
                            }
                          }}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {newMedication.frequency === 'once' ? '1' :
                           newMedication.frequency === 'twice' ? '2' :
                           newMedication.frequency === 'three_times' ? '3' : '4'}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newFreq = newMedication.frequency === 'once' ? 1 : 
                                          newMedication.frequency === 'twice' ? 2 :
                                          newMedication.frequency === 'three_times' ? 3 : 4;
                            if (newFreq < 4) {
                              const freqMap = { 1: 'once', 2: 'twice', 3: 'three_times', 4: 'four_times' };
                              const timesMap: Record<string, string[]> = {
                                'once': ['08:00'],
                                'twice': ['08:00', '20:00'],
                                'three_times': ['08:00', '14:00', '20:00'],
                                'four_times': ['08:00', '12:00', '16:00', '20:00']
                              };
                              const newFrequency = freqMap[(newFreq + 1) as keyof typeof freqMap];
                              setNewMedication({
                                ...newMedication,
                                frequency: newFrequency as 'once' | 'twice' | 'three_times' | 'four_times',
                                times: timesMap[newFrequency] || ['08:00']
                              });
                            }
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Medication Times</Label>
                      {newMedication.frequency !== 'as_needed' && newMedication.times.length > 0 && newMedication.times.map((time, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Label className="text-xs w-12">Time {index + 1}:</Label>
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => {
                              const updated = [...newMedication.times];
                              updated[index] = e.target.value;
                              setNewMedication({...newMedication, times: updated});
                            }}
                            className="flex-1 rounded-full"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <div className="flex gap-2 pt-4 justify-center">
                  <Button 
                    onClick={addMedication} 
                    className="rounded-full px-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    disabled={!newMedication.name.trim() || !newMedication.dosage.trim()}
                  >
                    {editingMode ? 'Update Medication' : 'Add Medication'}
                  </Button>
                </div>
              </div>
              )}
          </div>
        )}

        {/* Medications List */}
        {medications.length > 0 && !showAddMedication && (
          <div className="space-y-3 px-6 pb-6">
              {medications.map((medication) => (
                <Card key={medication.id} className="hover:shadow-md transition-shadow rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br from-green-100 to-emerald-100">
                            {medication.emoji}
                          </div>
                          <div>
                            <h3 className="font-medium">{medication.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {medication.dosage} • {medication.allDay ? 'All day' : getFrequencyLabel(medication.frequency)}
                            </p>
                            {!medication.allDay && medication.times.length > 0 && (
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {medication.times.map(time => (
                                  <div key={time} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                                    <Clock className="w-3 h-3" />
                                    <span>{time}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeTimeFromMedication(medication.id, time);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6"
                                  onClick={() => {
                                    setEditingMedication(medication);
                                    setShowEditTime(true);
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Time
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(medication)}
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMedication(medication.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
          
        {/* Edit Time Dialog */}
          {showEditTime && editingMedication && (
            <Dialog open={showEditTime} onOpenChange={setShowEditTime}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Add Time to {editingMedication.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="new-time">Select Time</Label>
                    <Input
                      id="new-time"
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addTimeToMedication} className="flex-1">
                      Add Time
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowEditTime(false);
                        setNewTime('08:00');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
      </DialogContent>
    </Dialog>
    
    {/* Info Dialog */}
    <Dialog open={showInfo} onOpenChange={setShowInfo}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Medication Reminder Information</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Medication Reminder helps you track and manage your medications. You can:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Add medications with specific dosages</li>
            <li>Set custom times for taking medications</li>
            <li>Track medication intake throughout the day</li>
            <li>Receive reminders at scheduled times</li>
            <li>View medication history and completion status</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Medications will appear as tasks in your timeline at the scheduled times.
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}