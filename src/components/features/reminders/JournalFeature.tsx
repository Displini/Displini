import { useState, useEffect, useMemo } from "react";
import { BookOpen, Plus, Calendar, Clock, Edit3, Trash2, Bell, X, ArrowLeft, Edit, Search, Filter } from "lucide-react";
import { colors } from "@/lib/designSystem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  time: string;
  mood?: string;
  tags: string[];
}

interface JournalSettings {
  isSetupComplete: boolean;
  scheduleFrequency: 'daily' | 'weekly' | 'custom';
  reminderTimes: string[];
  reminderDays?: string[]; // For weekly
  remindersEnabled: boolean;
}

interface JournalFeatureProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JournalFeature({ isOpen, onClose }: JournalFeatureProps) {
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Journal settings state
  const [settings, setSettings] = useState<JournalSettings>(() => {
    const saved = localStorage.getItem('journal_settings');
    return saved ? JSON.parse(saved) : {
      isSetupComplete: false,
      scheduleFrequency: 'daily',
      reminderTimes: [],
      reminderDays: [],
      remindersEnabled: false,
    };
  });

  const [reminderTimes, setReminderTimes] = useState<string[]>(settings.reminderTimes || []);
  const [newReminderTime, setNewReminderTime] = useState('20:00');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'custom'>(settings.scheduleFrequency || 'daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(settings.reminderDays || []);

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  // Load journal entries from localStorage
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('journal_entries');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });

  // Save journal entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('journal_entries', JSON.stringify(entries));
  }, [entries]);

  // Load settings on open
  useEffect(() => {
    if (!isOpen) return;
    
    const journalSettings = JSON.parse(localStorage.getItem('journal_settings') || '{}');
    const hasSetup = journalSettings.isSetupComplete || false;
    
    setSettings(journalSettings);
    setShowSetup(false);
    
    if (hasSetup) {
    setReminderTimes(journalSettings.reminderTimes || []);
      setScheduleFrequency(journalSettings.scheduleFrequency || 'daily');
      setSelectedDays(journalSettings.reminderDays || []);
      
      // Create reminders if enabled
      if (journalSettings.remindersEnabled && (journalSettings.reminderTimes?.length > 0)) {
        createJournalReminders(journalSettings);
      }
    }
  }, [isOpen]);

  // Create journal reminder tasks for all scheduled days (past 30 days and next 335 days)
  const createJournalReminders = (settingsOverride?: JournalSettings) => {
    const journalSettings = settingsOverride || settings;
    const times = journalSettings.reminderTimes || [];
    const frequency = journalSettings.scheduleFrequency || 'daily';
    const days = journalSettings.reminderDays || [];
    
    if (times.length === 0) return;
    
    const today = new Date();
    const tasks: any[] = [];
    const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
    
    // Remove existing journal reminders
    const filteredTasks = existingTasks.filter((t: any) => t.source !== 'journal');
    
    // Create reminders for past 30 days and next 335 days (365 total)
    for (let i = -30; i < 335; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Check if this date should have reminders based on frequency
      let shouldCreate = false;
      
      if (frequency === 'daily') {
        shouldCreate = true;
      } else if (frequency === 'weekly') {
        shouldCreate = days.includes(dayName);
      } else if (frequency === 'custom') {
        shouldCreate = true; // Custom means all days with selected times
      }
      
      if (shouldCreate) {
        times.forEach((time: string) => {
      tasks.push({
            id: `journal_${targetDateStr}_${time.replace(':', '')}`,
        title: '📔 Write Journal',
        notes: 'Take a moment to reflect and write in your journal',
        time: time,
            dueDate: targetDateStr,
        completed: false,
        allDay: false,
        source: 'journal',
        emoji: '📔',
            color: colors.features.journal || '#8B5CF6',
      });
    });
      }
    }
    
    localStorage.setItem('todos', JSON.stringify([...filteredTasks, ...tasks]));
    window.dispatchEvent(new Event('todosUpdated'));
    
    return tasks.length;
  };

  const handleSetupComplete = () => {
    const newSettings: JournalSettings = {
      isSetupComplete: true,
      scheduleFrequency: scheduleFrequency,
      reminderTimes: reminderTimes,
      reminderDays: scheduleFrequency === 'weekly' ? selectedDays : undefined,
      remindersEnabled: reminderTimes.length > 0,
    };
    
    setSettings(newSettings);
    localStorage.setItem('journal_settings', JSON.stringify(newSettings));
    setIsCollapsing(true);
    setTimeout(() => {
      setShowSetup(false);
      setIsCollapsing(false);
    }, 300);
    
    // Create reminders if enabled
    if (newSettings.remindersEnabled) {
      createJournalReminders(newSettings);
    }
  };

  const addReminderTime = () => {
    if (newReminderTime && !reminderTimes.includes(newReminderTime)) {
      const updated = [...reminderTimes, newReminderTime].sort();
      setReminderTimes(updated);
      setNewReminderTime('20:00');
    }
  };

  const removeReminderTime = (time: string) => {
    setReminderTimes(reminderTimes.filter(t => t !== time));
  };

  const toggleJournalReminders = (enabled: boolean) => {
    const newSettings = {
      ...settings,
      remindersEnabled: enabled,
    };
    setSettings(newSettings);
    localStorage.setItem('journal_settings', JSON.stringify(newSettings));
    
    if (enabled) {
      createJournalReminders(newSettings);
    } else {
      const existingTasks = JSON.parse(localStorage.getItem('todos') || '[]');
      const filteredTasks = existingTasks.filter((t: any) => t.source !== 'journal');
      localStorage.setItem('todos', JSON.stringify(filteredTasks));
      window.dispatchEvent(new Event('todosUpdated'));
    }
  };

  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: '',
    tags: ''
  });

  const handleAddEntry = () => {
    if (newEntry.title.trim() && newEntry.content.trim()) {
      const entry: JournalEntry = {
        id: Date.now().toString(),
        title: newEntry.title,
        content: newEntry.content,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        mood: newEntry.mood || undefined,
        tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      setEntries([entry, ...entries]);
      setNewEntry({ title: '', content: '', mood: '', tags: '' });
      setShowAddEntry(false);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || '',
      tags: entry.tags.join(', ')
    });
    setShowEditEntry(true);
  };

  const handleUpdateEntry = () => {
    if (editingEntry && newEntry.title.trim() && newEntry.content.trim()) {
      const updatedEntry: JournalEntry = {
        ...editingEntry,
        title: newEntry.title,
        content: newEntry.content,
        mood: newEntry.mood || undefined,
        tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      setEntries(entries.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      ));
      setEditingEntry(null);
      setNewEntry({ title: '', content: '', mood: '', tags: '' });
      setShowEditEntry(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'curious': return '🤔';
      case 'calm': return '😌';
      case 'sad': return '😔';
      case 'anxious': return '😰';
      case 'grateful': return '🙏';
      case 'motivated': return '💪';
      default: return '😐';
    }
  };

  // Get all unique moods and tags for filtering
  const allMoods = useMemo(() => {
    const moods = entries.filter(e => e.mood).map(e => e.mood!);
    return Array.from(new Set(moods));
  }, [entries]);

  const allTags = useMemo(() => {
    const tags = entries.flatMap(e => e.tags);
    return Array.from(new Set(tags));
  }, [entries]);

  // Filter entries based on search, date, mood, and tags
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Date filter
      if (filterDate && entry.date !== filterDate) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(query);
        const matchesContent = entry.content.toLowerCase().includes(query);
        const matchesTags = entry.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }
      
      // Mood filter
      if (filterMood && entry.mood !== filterMood) return false;
      
      // Tags filter
      if (filterTags.length > 0 && !filterTags.some(tag => entry.tags.includes(tag))) return false;
      
      return true;
    });
  }, [entries, filterDate, searchQuery, filterMood, filterTags]);

  // Handle journal task click from timeline
  useEffect(() => {
    const handleJournalTaskClick = (e: any) => {
      const taskId = e.detail?.taskId;
      const taskDate = e.detail?.date;
      const taskTime = e.detail?.time;
      
      if (taskId || taskDate) {
        setShowAddEntry(true);
        // Pre-fill with date/time if provided
        if (taskDate) {
          setNewEntry(prev => ({
            ...prev,
            title: taskTime ? `Journal Entry - ${taskTime}` : 'Journal Entry',
          }));
        }
      }
    };
    
    // Listen for both openJournal and openJournalWrite events
    window.addEventListener('openJournal', handleJournalTaskClick);
    window.addEventListener('openJournalWrite', handleJournalTaskClick);
    return () => {
      window.removeEventListener('openJournal', handleJournalTaskClick);
      window.removeEventListener('openJournalWrite', handleJournalTaskClick);
    };
  }, []);

  const journalColor = colors.features.journal || '#8B5CF6';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        {/* Header for when setup is complete */}
        {settings.isSetupComplete && !showSetup && (
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: journalColor }} />
            Journal
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

        {/* Setup Flow */}
        {(!settings.isSetupComplete || showSetup) && (
          <div className={`transition-all duration-700 ease-in-out overflow-hidden ${showSetup || isCollapsing ? 'min-h-[600px]' : ''}`}>
            <div className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  {showSetup ? (
                    <>
                      <ArrowLeft 
                        className="w-4 h-4 cursor-pointer" 
                        style={{ color: journalColor }}
                        onClick={() => {
                          setIsCollapsing(true);
                          setTimeout(() => {
                            setShowSetup(false);
                            setIsCollapsing(false);
                          }, 700);
                        }}
                      />
                      <span>{settings.isSetupComplete ? 'Edit Journal Settings' : 'Set up your Journal'}</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5" style={{ color: journalColor }} />
                      Journal
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
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <BookOpen className="w-8 h-8" style={{ color: journalColor }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: journalColor }}>Set up your Journal</h3>
                <p className="text-sm text-muted-foreground mb-6">Schedule journal reminders and start reflecting</p>
                <button
                  onClick={() => setShowSetup(true)}
                  className="mt-4 w-12 h-12 rounded-full backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/30 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                  style={{ color: journalColor }}
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Setup Form Content */}
            {showSetup && (
              <div className="px-6 pb-6 animate-in fade-in duration-300 max-w-md mx-auto">
                <div className="space-y-6">
                  {/* Schedule Frequency */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold block text-center">Reminder Schedule</Label>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant={scheduleFrequency === 'daily' ? 'default' : 'outline'}
                        onClick={() => setScheduleFrequency('daily')}
                        className="rounded-full"
                      >
                        Daily
                      </Button>
                      <Button
                        size="sm"
                        variant={scheduleFrequency === 'weekly' ? 'default' : 'outline'}
                        onClick={() => setScheduleFrequency('weekly')}
                        className="rounded-full"
                      >
                        Weekly
                      </Button>
                      <Button
                        size="sm"
                        variant={scheduleFrequency === 'custom' ? 'default' : 'outline'}
                        onClick={() => setScheduleFrequency('custom')}
                        className="rounded-full"
                      >
                        Custom Times
                      </Button>
                    </div>
                  </div>

                  {/* Weekly Day Selection */}
                  {scheduleFrequency === 'weekly' && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold block text-center">Select Days</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {daysOfWeek.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={day.value}
                              checked={selectedDays.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDays([...selectedDays, day.value]);
                                } else {
                                  setSelectedDays(selectedDays.filter(d => d !== day.value));
                                }
                              }}
                            />
                            <Label htmlFor={day.value} className="text-sm">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reminder Times */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold block text-center">Reminder Times</Label>
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
                    
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                        className="flex-1 rounded-full"
                      />
                      <Button size="sm" onClick={addReminderTime} className="rounded-full">
                        Add Time
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSetupComplete}
                    disabled={reminderTimes.length === 0 || (scheduleFrequency === 'weekly' && selectedDays.length === 0)}
                    className="w-full rounded-full disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Journal View */}
        {settings.isSetupComplete && !showSetup && (
        <div className="flex-1 overflow-hidden flex flex-col">
            {/* Header with Stats */}
            <div className="px-6 pt-4 pb-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{entries.length}</p>
                  <p className="text-sm text-muted-foreground">Entries</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {entries.filter(e => e.mood).length}
                  </p>
                  <p className="text-sm text-muted-foreground">With Mood</p>
                </div>
              </div>
              <Button onClick={() => setShowAddEntry(true)} className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </div>
            
              {/* Reminders Overview */}
              {settings.reminderTimes.length > 0 && (
                <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5" style={{ color: journalColor }} />
                  <div>
                        <p className="text-sm font-medium">Journal Reminders</p>
                        <p className="text-xs text-muted-foreground">
                          {settings.scheduleFrequency === 'daily' ? 'Daily' : 
                           settings.scheduleFrequency === 'weekly' ? `Weekly (${settings.reminderDays?.length || 0} days)` : 
                           'Custom'} • {settings.reminderTimes.length} time(s)
                        </p>
              </div>
                    </div>
                    <Switch
                      checked={settings.remindersEnabled}
                      onCheckedChange={toggleJournalReminders}
                    />
                  </div>
                </div>
              )}
              
              {/* Search and Filters */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 rounded-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className="rounded-full"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
            </div>
            
                {/* Advanced Filters */}
                {showFilters && (
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="filter-date" className="text-sm">Date</Label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                          className="mt-1 rounded-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="filter-mood" className="text-sm">Mood</Label>
                        <Select value={filterMood} onValueChange={setFilterMood}>
                          <SelectTrigger className="mt-1 rounded-full">
                            <SelectValue placeholder="All moods" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All moods</SelectItem>
                            {allMoods.map(mood => (
                              <SelectItem key={mood} value={mood}>
                                {getMoodEmoji(mood)} {mood}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {allTags.length > 0 && (
                      <div>
                        <Label className="text-sm mb-2 block">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {allTags.map(tag => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag}`}
                                checked={filterTags.includes(tag)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilterTags([...filterTags, tag]);
                                  } else {
                                    setFilterTags(filterTags.filter(t => t !== tag));
                                  }
                                }}
                              />
                              <Label htmlFor={`tag-${tag}`} className="text-sm">
                                #{tag}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(filterDate || filterMood || filterTags.length > 0 || searchQuery) && (
                <Button
                        variant="outline"
                  size="sm"
                        onClick={() => {
                          setFilterDate('');
                          setFilterMood('');
                          setFilterTags([]);
                          setSearchQuery('');
                        }}
                        className="w-full"
                >
                        Clear Filters
                </Button>
                    )}
                  </div>
              )}
            </div>
          </div>

          {/* Journal Entries */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow rounded-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{entry.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{entry.date}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{entry.time}</span>
                          </span>
                          {entry.mood && (
                              <span className="flex items-center space-x-1">
                              <span>{getMoodEmoji(entry.mood)}</span>
                              <span className="capitalize">{entry.mood}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEntry(entry)}
                          className="h-8 w-8"
                        >
                          <Edit3 className="w-4 h-4" />
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
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground leading-relaxed mb-3 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {entries.length === 0 ? 'No entries yet' : 'No entries match your filters'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {entries.length === 0 ? 'Start your journaling journey today' : 'Try adjusting your search or filters'}
                  </p>
                  {entries.length === 0 && (
                <Button onClick={() => setShowAddEntry(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Write First Entry
                </Button>
                  )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Add Entry Dialog */}
        <Dialog open={showAddEntry} onOpenChange={setShowAddEntry}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  placeholder="Write your thoughts here..."
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mood">Mood (Optional)</Label>
                  <Select value={newEntry.mood} onValueChange={(value) => setNewEntry({ ...newEntry, mood: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="happy">😊 Happy</SelectItem>
                      <SelectItem value="excited">🤩 Excited</SelectItem>
                      <SelectItem value="curious">🤔 Curious</SelectItem>
                      <SelectItem value="calm">😌 Calm</SelectItem>
                      <SelectItem value="sad">😔 Sad</SelectItem>
                      <SelectItem value="anxious">😰 Anxious</SelectItem>
                      <SelectItem value="grateful">🙏 Grateful</SelectItem>
                      <SelectItem value="motivated">💪 Motivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                    placeholder="gratitude, work, personal..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddEntry(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddEntry} 
                  disabled={!newEntry.title.trim() || !newEntry.content.trim()}
                  className="disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  Save Entry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Entry Dialog */}
        <Dialog open={showEditEntry} onOpenChange={setShowEditEntry}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  placeholder="Write your thoughts here..."
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-mood">Mood (Optional)</Label>
                  <Select value={newEntry.mood} onValueChange={(value) => setNewEntry({ ...newEntry, mood: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="happy">😊 Happy</SelectItem>
                      <SelectItem value="excited">🤩 Excited</SelectItem>
                      <SelectItem value="curious">🤔 Curious</SelectItem>
                      <SelectItem value="calm">😌 Calm</SelectItem>
                      <SelectItem value="sad">😔 Sad</SelectItem>
                      <SelectItem value="anxious">😰 Anxious</SelectItem>
                      <SelectItem value="grateful">🙏 Grateful</SelectItem>
                      <SelectItem value="motivated">💪 Motivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-tags">Tags (Optional)</Label>
                  <Input
                    id="edit-tags"
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                    placeholder="gratitude, work, personal..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditEntry(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateEntry} 
                  disabled={!newEntry.title.trim() || !newEntry.content.trim()}
                  className="disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
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
