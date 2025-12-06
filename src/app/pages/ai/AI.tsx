import { useState } from "react";
import { SEO } from "@/app/components/shared/SEO";
import { Sparkles, Send, Bot, User, Plus, Settings } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import AppHeader from "@/app/shared/AppHeader";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AI() {
  const [showSettings, setShowSettings] = useState(false);
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

    // Simulate AI response
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
    <div className="min-h-screen bg-background pb-20 pt-16">
      <SEO
        title="AI Assistant"
        description="Chat with your AI assistant"
        noindex={true}
      />
      <AppHeader 
        title="AI Assistant" 
        subtitle="Your intelligent productivity companion"
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="max-w-4xl mx-auto p-4">

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setInputText(action.text)}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm text-center">{action.text}</span>
            </Button>
          ))}
        </div>

        {/* Chat Messages */}
        <Card className="h-96 overflow-y-auto mb-4">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${
                  message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-lg px-4 py-2 ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Input Area */}
        <div className="flex space-x-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} disabled={!inputText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Features */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">What I can help you with:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-medium mb-2">📋 Task Management</h4>
              <p className="text-sm text-muted-foreground">
                Create, organize, and prioritize your tasks and reminders
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium mb-2">📅 Calendar Planning</h4>
              <p className="text-sm text-muted-foreground">
                Schedule events and optimize your daily routine
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium mb-2">💡 Productivity Tips</h4>
              <p className="text-sm text-muted-foreground">
                Get personalized advice to boost your efficiency
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium mb-2">🎯 Goal Setting</h4>
              <p className="text-sm text-muted-foreground">
                Set and track your personal and professional goals
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
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
              <Button 
                onClick={() => setShowSettings(false)}
                className="w-full"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
