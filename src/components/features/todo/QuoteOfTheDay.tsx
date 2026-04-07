import { useState, useEffect } from "react";
import { Quote, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.", author: "Roy T. Bennett" },
  { text: "I learned that courage was not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "In this life we cannot do great things. We can only do small things with great love.", author: "Mother Teresa" },
  { text: "Only a life lived for others is a life worthwhile.", author: "Albert Einstein" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
  { text: "Never bend your head. Always hold it high. Look the world straight in the eye.", author: "Helen Keller" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "The person who says it cannot be done should not interrupt the person who is doing it.", author: "Chinese Proverb" },
  { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell" },
];

interface QuoteSettings {
  enabled: boolean;
}

export function QuoteOfTheDay() {
  const [settings, setSettings] = useState<QuoteSettings>(() => {
    const saved = localStorage.getItem('quote_settings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
    };
  });
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('quote_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('quoteSettingsChanged'));
  }, [settings]);

  const getDailyQuote = () => {
    const today = new Date().toDateString();
    const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % quotes.length;
    return quotes[index];
  };

  const quote = getDailyQuote();

  return settings.enabled ? (
    <div className="relative p-3 rounded-xl bg-gradient-to-br from-muted/30 to-transparent border border-border/60 shadow-sm max-w-full transition-all duration-200">
      <Quote className="w-4 h-4 text-muted-foreground/30 absolute top-3 left-3" />
      <div className="pl-8 pr-8">
        <p className={`text-sm leading-relaxed text-foreground mb-1 italic transition-all duration-200 ${isCollapsed ? 'line-clamp-1' : ''}`}>
          "{quote.text}"
        </p>
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground font-medium">
            — {quote.author}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand quote" : "Collapse quote"}
      >
        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </Button>
    </div>
  ) : null;
}

export function getQuoteSettings(): QuoteSettings {
  const saved = localStorage.getItem('quote_settings');
  return saved ? JSON.parse(saved) : { enabled: false };
}

export function getDailyQuote() {
  const today = new Date().toDateString();
  const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % quotes.length;
  return quotes[index];
}

