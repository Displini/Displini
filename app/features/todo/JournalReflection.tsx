import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Calendar, BookOpen, Heart, Lightbulb, Target, Mic, Sparkles, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";

interface JournalEntry {
  id: string;
  date: string;
  prompt: string;
  content: string;
  mood?: number;
  tags?: string[];
  aiStory?: string; // AI-generated beautiful story
}

const dailyPrompts = [
  "What are you grateful for today?",
  "What was the highlight of your day?",
  "What challenged you today and how did you handle it?",
  "What did you learn about yourself today?",
  "How did you take care of yourself today?",
  "What made you smile today?",
  "What would you like to improve tomorrow?",
  "What are you looking forward to?",
  "What made you proud today?",
  "How did you show kindness today?"
];

const reflectionCategories = [
  { icon: Heart, label: "Gratitude", color: "text-red-500" },
  { icon: Target, label: "Goals", color: "text-blue-500" },
  { icon: Lightbulb, label: "Insights", color: "text-yellow-500" },
  { icon: BookOpen, label: "Learning", color: "text-green-500" }
];

export default function JournalReflection() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('journalEntries');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(dailyPrompts[0]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentEntry(prev => prev + ' ' + transcript);
      };
      
      recognitionInstance.onerror = (event: any) => {
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const getTodayEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    return entries.find(entry => entry.date === today);
  };

  const saveEntry = () => {
    if (!currentEntry.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const existingEntry = entries.find(entry => entry.date === today);

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: today,
      prompt: selectedPrompt,
      content: currentEntry.trim(),
      mood: selectedMood || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    };

    if (existingEntry) {
      setEntries(prev => prev.map(entry => 
        entry.date === today ? newEntry : entry
      ));
    } else {
      setEntries(prev => [newEntry, ...prev]);
    }

    setCurrentEntry('');
    setSelectedMood(null);
    setSelectedTags([]);
  };

  const getRecentEntries = () => {
    return entries.slice(0, 7);
  };

  const getEntryCount = () => {
    return entries.length;
  };

  const getStreak = () => {
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasEntry = entries.some(entry => entry.date === dateStr);
      
      if (hasEntry) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const generateAIStory = async (entry: JournalEntry) => {
    setIsGeneratingStory(true);
    try {
      const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: entry.content,
          prompt: entry.prompt,
          mood: entry.mood,
          tags: entry.tags
        })
      });
      
      const data = await response.json();
      if (data.story) {
        // Update the entry with the AI story
        setEntries(prev => prev.map(e => 
          e.id === entry.id ? { ...e, aiStory: data.story } : e
        ));
      }
    } catch (error) {
      // Error generating story
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const todayEntry = getTodayEntry();
  const recentEntries = getRecentEntries();
  const entryCount = getEntryCount();
  const streak = getStreak();

  return (
    <div>
        <Tabs defaultValue="write" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{entryCount}</p>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-chart-2">{streak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Today's Prompt</label>
                <select
                  value={selectedPrompt}
                  onChange={(e) => setSelectedPrompt(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  {dailyPrompts.map((prompt, index) => (
                    <option key={index} value={prompt}>{prompt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Your Reflection</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSpeechRecognition}
                    disabled={!recognition}
                    className={isListening ? 'bg-red-100 border-red-500' : ''}
                  >
                    {isListening ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3 mr-2" />
                        Voice Input
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  placeholder="Write your thoughts here... or use voice input"
                  value={currentEntry}
                  onChange={(e) => setCurrentEntry(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mood (Optional)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mood) => (
                    <Button
                      key={mood}
                      variant={selectedMood === mood ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {reflectionCategories.map((category) => (
                    <Button
                      key={category.label}
                      variant={selectedTags.includes(category.label) ? "default" : "outline"}
                      size="sm"
                      onClick={() => 
                        selectedTags.includes(category.label) 
                          ? removeTag(category.label)
                          : addTag(category.label)
                      }
                      className="text-xs"
                    >
                      <category.icon className="w-3 h-3 mr-1" />
                      {category.label}
                    </Button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={saveEntry} disabled={!currentEntry.trim()} className="w-full">
                Save Entry
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            {todayEntry ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Today's Entry</h4>
                    <Badge variant="outline">{format(new Date(todayEntry.date), 'MMM d')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{todayEntry.prompt}</p>
                  <p className="text-sm leading-relaxed">{todayEntry.content}</p>
                  {todayEntry.mood && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Mood:</span>
                      <Badge variant="outline">{todayEntry.mood}/10</Badge>
                    </div>
                  )}
                  {todayEntry.tags && todayEntry.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {todayEntry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* AI Story button */}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateAIStory(todayEntry)}
                      disabled={isGeneratingStory}
                    >
                      {isGeneratingStory ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-2" />
                          Generate AI Story
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Show AI Story if generated */}
                  {todayEntry.aiStory && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <h5 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI Story
                      </h5>
                      <p className="text-sm leading-relaxed italic">{todayEntry.aiStory}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No entry for today yet</p>
                <p className="text-sm text-muted-foreground">Start writing in the Write tab</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-3">
              {recentEntries.length > 0 ? (
                recentEntries.map((entry) => (
                  <div key={entry.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{format(new Date(entry.date), 'MMM d, yyyy')}</h4>
                      {entry.mood && (
                        <Badge variant="outline" className="text-xs">{entry.mood}/10</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{entry.prompt}</p>
                    <p className="text-sm leading-relaxed line-clamp-3">{entry.content}</p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No journal entries yet</p>
                  <p className="text-sm text-muted-foreground">Start your reflection journey today</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
