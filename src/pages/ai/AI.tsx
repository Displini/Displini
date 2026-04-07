import { useState } from "react";
import { SEO } from "@/components/general/SEO";
import { Send, Bot, User, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader, FeaturesSidebar } from "@/components/general";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AI() {
  const [showSettings, setShowSettings] = useState(false);
  const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    autoSuggestions: true,
    voiceInput: false,
    smartReminders: true,
    personalization: true,
    dataSharing: false
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I understand your request. I'm here to help you with your productivity, health tracking, and daily tasks. What would you like to know more about?",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const quickActions = [
    { text: "Help me plan my day", icon: "📅" },
    { text: "Set up a reminder", icon: "⏰" },
    { text: "Track my mood", icon: "😊" },
    { text: "Create a workout plan", icon: "💪" }
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <SEO
        title="AI Assistant"
        description="Chat with your AI assistant"
        noindex={true}
      />

      {/* Fixed Header */}
      <div className="flex-shrink-0 sticky top-0 z-50 backdrop-blur-2xl bg-white/40 dark:bg-gray-900/40 border-b border-white/30 dark:border-gray-700/30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFeaturesMenu(true)}
              className="flex-shrink-0 h-10 w-10"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center">
              AI Assistant
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="flex-shrink-0 h-10 w-10"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat area - scrollable */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[85%] sm:max-w-[75%] ${
                  message.isUser ? 'flex-row-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Input - above bottom nav */}
        <div className="flex-shrink-0 p-4 pb-28 sm:pb-32 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="rounded-full h-8 text-xs"
                  onClick={() => setInputText(action.text)}
                >
                  <span className="mr-1">{action.icon}</span>
                  {action.text}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 min-w-0 max-w-full"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={!inputText.trim()} size="icon" className="flex-shrink-0 h-10 w-10">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FeaturesSidebar
        isOpen={showFeaturesMenu}
        onClose={() => setShowFeaturesMenu(false)}
        onSettingsClick={() => { setShowSettings(true); setShowFeaturesMenu(false); }}
      />

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>AI Settings</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSuggestions" className="text-sm font-medium">
                  Auto Suggestions
                </Label>
                <Switch
                  id="autoSuggestions"
                  checked={aiSettings.autoSuggestions}
                  onCheckedChange={(checked) =>
                    setAiSettings(prev => ({ ...prev, autoSuggestions: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="voiceInput" className="text-sm font-medium">
                  Voice Input
                </Label>
                <Switch
                  id="voiceInput"
                  checked={aiSettings.voiceInput}
                  onCheckedChange={(checked) =>
                    setAiSettings(prev => ({ ...prev, voiceInput: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smartReminders" className="text-sm font-medium">
                  Smart Reminders
                </Label>
                <Switch
                  id="smartReminders"
                  checked={aiSettings.smartReminders}
                  onCheckedChange={(checked) =>
                    setAiSettings(prev => ({ ...prev, smartReminders: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="personalization" className="text-sm font-medium">
                  Personalization
                </Label>
                <Switch
                  id="personalization"
                  checked={aiSettings.personalization}
                  onCheckedChange={(checked) =>
                    setAiSettings(prev => ({ ...prev, personalization: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dataSharing" className="text-sm font-medium">
                  Data Sharing
                </Label>
                <Switch
                  id="dataSharing"
                  checked={aiSettings.dataSharing}
                  onCheckedChange={(checked) =>
                    setAiSettings(prev => ({ ...prev, dataSharing: checked }))
                  }
                />
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button onClick={() => setShowSettings(false)} className="w-full">
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
