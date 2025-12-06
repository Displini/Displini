import { useState, useEffect } from "react";
import { Heart, Calendar, Plus, Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { colors } from "@/lib/designSystem";
import { handleError, handleSuccess } from "@/lib/errorHandling";

interface CycleEntry {
  id: string;
  date: string;
  type: 'period' | 'ovulation' | 'symptom' | 'mood';
  intensity?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  mood?: 'happy' | 'sad' | 'anxious' | 'calm' | 'irritable' | 'energetic';
  notes?: string;
}

interface MenstrualCycleTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MenstrualCycleTracker({ isOpen, onClose }: MenstrualCycleTrackerProps) {
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CycleEntry | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'period' | 'ovulation' | 'symptom' | 'mood'>('all');

  const [entries, setEntries] = useState<CycleEntry[]>([]);

  // Load entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('menstrual_entries');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, [isOpen]);

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'period' as 'period' | 'ovulation' | 'symptom' | 'mood',
    intensity: 'medium' as 'light' | 'medium' | 'heavy',
    symptoms: [] as string[],
    mood: 'calm' as 'happy' | 'sad' | 'anxious' | 'calm' | 'irritable' | 'energetic',
    notes: ''
  });

  const symptoms = [
    'cramps', 'bloating', 'headache', 'fatigue', 'mood swings', 'breast tenderness',
    'back pain', 'nausea', 'increased energy', 'acne', 'food cravings', 'insomnia'
  ];

  const moods = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'calm', label: 'Calm', emoji: '😌' },
    { value: 'irritable', label: 'Irritable', emoji: '😠' },
    { value: 'energetic', label: 'Energetic', emoji: '⚡' }
  ];

  const handleAddEntry = () => {
    if (newEntry.date && newEntry.type) {
      try {
        const entry: CycleEntry = {
          id: Date.now().toString(),
          date: newEntry.date,
          type: newEntry.type,
          intensity: newEntry.type === 'period' ? newEntry.intensity : undefined,
          symptoms: newEntry.symptoms,
          mood: newEntry.mood,
          notes: newEntry.notes
        };
        
        const updated = [entry, ...entries];
        setEntries(updated);
        localStorage.setItem('menstrual_entries', JSON.stringify(updated));
        handleSuccess('Entry added successfully');
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          type: 'period',
          intensity: 'medium',
          symptoms: [],
          mood: 'calm',
          notes: ''
        });
        setShowAddEntry(false);
      } catch (error) {
        handleError(error, { title: 'Failed to Add Entry' });
      }
    }
  };

  const handleEditEntry = (entry: CycleEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      date: entry.date,
      type: entry.type,
      intensity: entry.intensity || 'medium',
      symptoms: entry.symptoms || [],
      mood: entry.mood || 'calm',
      notes: entry.notes || ''
    });
    setShowEditEntry(true);
  };

  const handleUpdateEntry = () => {
    if (editingEntry && newEntry.date && newEntry.type) {
      const updatedEntry: CycleEntry = {
        ...editingEntry,
        date: newEntry.date,
        type: newEntry.type,
        intensity: newEntry.type === 'period' ? newEntry.intensity : undefined,
        symptoms: newEntry.symptoms,
        mood: newEntry.mood,
        notes: newEntry.notes
      };
      
      const updated = entries.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      );
      setEntries(updated);
      localStorage.setItem('menstrual_entries', JSON.stringify(updated));
      setEditingEntry(null);
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        type: 'period',
        intensity: 'medium',
        symptoms: [],
        mood: 'calm',
        notes: ''
      });
      setShowEditEntry(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    try {
      const updated = entries.filter(entry => entry.id !== id);
      setEntries(updated);
      localStorage.setItem('menstrual_entries', JSON.stringify(updated));
      handleSuccess('Entry deleted');
    } catch (error) {
      handleError(error, { title: 'Failed to Delete Entry' });
    }
  };

  const toggleSymptom = (symptom: string) => {
    setNewEntry(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'period': return '🩸';
      case 'ovulation': return '🥚';
      case 'symptom': return '⚠️';
      case 'mood': return '💭';
      default: return '📅';
    }
  };

  const getTypeColor = (type: string) => {
    // Using design system colors to match landing page
    switch (type) {
      case 'period': return 'text-white';
      case 'ovulation': return 'bg-green-100 text-green-800';
      case 'symptom': return 'bg-yellow-100 text-yellow-800';
      case 'mood': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTypeStyle = (type: string) => {
    if (type === 'period') {
      return { backgroundColor: colors.features.menstrual, color: 'white' };
    }
    return undefined;
  };

  const filteredEntries = selectedType === 'all' 
    ? entries 
    : entries.filter(entry => entry.type === selectedType);

  const getCycleStats = () => {
    const periodEntries = entries.filter(e => e.type === 'period');
    const lastPeriod = periodEntries[0];
    const cycleLength = periodEntries.length > 1 
      ? Math.round((new Date(periodEntries[0].date).getTime() - new Date(periodEntries[1].date).getTime()) / (1000 * 60 * 60 * 24))
      : 28;
    
    return {
      lastPeriod: lastPeriod?.date,
      cycleLength,
      totalEntries: entries.length
    };
  };

  const stats = getCycleStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Menstrual Cycle Tracker
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.totalEntries}</div>
                <div className="text-sm text-muted-foreground">Total Entries</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.cycleLength}</div>
                <div className="text-sm text-muted-foreground">Avg Cycle (days)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {stats.lastPeriod ? new Date(stats.lastPeriod).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Last Period</div>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Add Button */}
          <div className="flex justify-between items-center mb-4">
            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entries</SelectItem>
                <SelectItem value="period">Period</SelectItem>
                <SelectItem value="ovulation">Ovulation</SelectItem>
                <SelectItem value="symptom">Symptoms</SelectItem>
                <SelectItem value="mood">Mood</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddEntry(true)} className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>

          {/* Entries List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getTypeIcon(entry.type)}</span>
                          <h4 className="font-medium capitalize">{entry.type}</h4>
                          <Badge className={getTypeColor(entry.type)} style={getTypeStyle(entry.type)}>
                            {entry.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {entry.intensity && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Intensity: <span className="capitalize">{entry.intensity}</span>
                          </div>
                        )}
                        
                        {entry.symptoms && entry.symptoms.length > 0 && (
                          <div className="mb-2">
                            <div className="text-sm text-muted-foreground mb-1">Symptoms:</div>
                            <div className="flex flex-wrap gap-1">
                              {entry.symptoms.map((symptom, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {entry.mood && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Mood: {moods.find(m => m.value === entry.mood)?.emoji} {moods.find(m => m.value === entry.mood)?.label}
                          </div>
                        )}
                        
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground">{entry.notes}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEntry(entry)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No entries yet</h3>
                <p className="text-muted-foreground mb-4">Start tracking your cycle today</p>
                <Button onClick={() => setShowAddEntry(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Entry
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Add Entry Dialog */}
        <Dialog open={showAddEntry} onOpenChange={setShowAddEntry}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Cycle Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry-date">Date</Label>
                  <Input
                    id="entry-date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="entry-type">Type</Label>
                  <Select value={newEntry.type} onValueChange={(value: any) => setNewEntry({ ...newEntry, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="period">Period</SelectItem>
                      <SelectItem value="ovulation">Ovulation</SelectItem>
                      <SelectItem value="symptom">Symptom</SelectItem>
                      <SelectItem value="mood">Mood</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newEntry.type === 'period' && (
                <div>
                  <Label htmlFor="intensity">Intensity</Label>
                  <Select value={newEntry.intensity} onValueChange={(value: any) => setNewEntry({ ...newEntry, intensity: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Symptoms</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {symptoms.map((symptom) => (
                    <Button
                      key={symptom}
                      variant={newEntry.symptoms.includes(symptom) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSymptom(symptom)}
                      className="text-xs"
                    >
                      {symptom}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Mood</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {moods.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={newEntry.mood === mood.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewEntry({ ...newEntry, mood: mood.value as any })}
                      className="text-xs"
                    >
                      {mood.emoji} {mood.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddEntry(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntry}>
                  Add Entry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Entry Dialog */}
        <Dialog open={showEditEntry} onOpenChange={setShowEditEntry}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Cycle Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-entry-date">Date</Label>
                  <Input
                    id="edit-entry-date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-entry-type">Type</Label>
                  <Select value={newEntry.type} onValueChange={(value: any) => setNewEntry({ ...newEntry, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="period">Period</SelectItem>
                      <SelectItem value="ovulation">Ovulation</SelectItem>
                      <SelectItem value="symptom">Symptom</SelectItem>
                      <SelectItem value="mood">Mood</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newEntry.type === 'period' && (
                <div>
                  <Label htmlFor="edit-intensity">Intensity</Label>
                  <Select value={newEntry.intensity} onValueChange={(value: any) => setNewEntry({ ...newEntry, intensity: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Symptoms</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {symptoms.map((symptom) => (
                    <Button
                      key={symptom}
                      variant={newEntry.symptoms.includes(symptom) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSymptom(symptom)}
                      className="text-xs"
                    >
                      {symptom}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Mood</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {moods.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={newEntry.mood === mood.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewEntry({ ...newEntry, mood: mood.value as any })}
                      className="text-xs"
                    >
                      {mood.emoji} {mood.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Textarea
                  id="edit-notes"
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditEntry(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateEntry}>
                  Update Entry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
