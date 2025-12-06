import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Plus } from "lucide-react";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  category?: "common" | "medication" | "sport" | "food" | "work";
}

// Common emojis for all use cases
const commonEmojis = ["📝", "📅", "💼", "🎯", "✅", "📞", "💻", "📧", "🏃", "🏋️", "🍎", "🥗", "💊", "💤", "🧘", "📓", "📚", "🎓", "🛒", "🏠", "🚗", "✈️", "💰", "❤️", "🎉", "⭐"];

// Category-specific emojis
const healthEmojis = ["💊", "💉", "🩺", "🩹", "🌡️", "🧪", "🧬", "🦷", "🦴", "🧠", "🫀", "🫁", "👁️", "👂", "🩸", "💆", "💆‍♂️", "💆‍♀️", "🧖", "🧖‍♂️"];

const sportEmojis = ["🏃", "🏃‍♀️", "🏃‍♂️", "🚴", "🚴‍♀️", "🚴‍♂️", "🏊", "🏊‍♀️", "🏊‍♂️", "🏋️", "🏋️‍♀️", "🏋️‍♂️", "🤸", "🤸‍♀️", "🤸‍♂️", "🧘", "🧘‍♀️", "🧘‍♂️", "⛹️", "⛹️‍♀️", "⛹️‍♂️", "🤾", "🤾‍♀️", "🤾‍♂️", "🏌️", "🏌️‍♀️", "🏌️‍♂️", "🧗", "🧗‍♀️", "🧗‍♂️", "🤺", "🏇", "⛷️", "🏂", "🤼", "🤼‍♀️", "🤼‍♂️", "🤽", "🤽‍♀️", "🤽‍♂️", "🚣", "🚣‍♀️", "🚣‍♂️", "👟", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🪃", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️"];

const foodEmojis = ["🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🥝", "🍅", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🥒", "🥬", "🥦", "🍄", "🥜", "🌰", "🍞", "🥐", "🥖", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫"];

const workEmojis = ["💼", "💻", "⌨️", "🖥️", "🖨️", "📱", "📞", "☎️", "📧", "📨", "📩", "📬", "📮", "🗂️", "📁", "📂", "📋", "📊", "📈", "📉", "🗒️", "📝", "📄", "📃", "📑", "🔖", "🏢", "🏭", "🏗️", "🏛️", "🕐", "⏰", "⏱️", "⏲️", "🔔", "📣"];

// All emojis combined
const allEmojis = {
  smileys: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳"],
  activities: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿"],
  food: foodEmojis,
  objects: ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "⏱️", "⏲️"],
  symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "✨", "⭐", "🌟", "💫", "✅", "❌", "⭕", "✔️", "☑️", "❓", "❗", "💯"],
};

export function EmojiPicker({ value, onChange, category = "common" }: EmojiPickerProps) {
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof allEmojis>("smileys");

  // Get category-specific emojis
  const getCategoryEmojis = () => {
    switch (category) {
      case "medication":
        return healthEmojis;
      case "sport":
        return sportEmojis;
      case "food":
        return foodEmojis;
      case "work":
        return workEmojis;
      default:
        return commonEmojis;
    }
  };

  const displayedEmojis = showAllEmojis 
    ? allEmojis[emojiCategory] 
    : getCategoryEmojis();

  // Limit to 3 rows (approximately 18 emojis per row = 54 total), minus 1 for the + button
  const maxEmojis = 51;
  const visibleEmojis = displayedEmojis.slice(0, maxEmojis);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-2 max-h-[150px] overflow-hidden">
        {visibleEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
              value === emoji
                ? "bg-primary"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {emoji}
          </button>
        ))}
        {!showAllEmojis && (
          <button
            type="button"
            onClick={() => setShowAllEmojis(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
            title="Show more emojis"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {showAllEmojis && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2 flex-wrap">
            {Object.keys(allEmojis).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setEmojiCategory(cat as keyof typeof allEmojis)}
                className={`px-3 py-1 rounded-lg text-xs transition-all capitalize ${
                  emojiCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAllEmojis(false)}
          >
            Show Less
          </Button>
        </div>
      )}
    </div>
  );
}

