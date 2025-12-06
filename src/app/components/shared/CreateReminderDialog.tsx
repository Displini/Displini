import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Image as ImageIcon, X, MapPin, Flag } from "lucide-react";
import { ImageViewerDialog } from "@/app/components/shared";
import { useIsMobile } from "@/hooks/use-mobile";

interface Reminder {
  id: string;
  title: string;
  emoji?: string;
  note?: string;
  image?: string; // base64 data URL
  location?: string;
  important: boolean;
  createdAt: string;
  scheduled: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  completed: boolean;
}

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'scheduled' | 'completed'>) => void;
  initialData?: {
    title: string;
    emoji?: string;
    note?: string;
    image?: string;
    location?: string;
    important: boolean;
  };
}

export default function CreateReminderDialog({ 
  open, 
  onOpenChange, 
  onSave,
  initialData
}: CreateReminderDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [emoji, setEmoji] = useState(initialData?.emoji || '⏰');
  const [note, setNote] = useState(initialData?.note || '');
  const [image, setImage] = useState<string | undefined>(initialData?.image);
  const [location, setLocation] = useState(initialData?.location || '');
  const [important, setImportant] = useState(initialData?.important || false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
  const emojiInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Common emojis for the popover
  const commonEmojis = [
    "⏰", "📝", "📅", "💼", "🎯", "✅", "📞", "💻", "📧", "🏃", "🏋️", "🍎",
    "🥗", "💊", "💤", "🧘", "📓", "📚", "🎓", "🛒", "🏠", "🚗", "✈️", "💰",
    "❤️", "🎉", "⭐", "🔥", "💡", "🎨", "🎵", "🎬", "📷", "🎮", "⚽", "🏀",
    "🎪", "🎭", "🎤", "🎸", "🎹", "🎺", "🎻", "🥁", "🎲", "🃏", "🀄", "🎴"
  ];

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || '');
        setEmoji(initialData.emoji || '⏰');
        setNote(initialData.note || '');
        setImage(initialData.image);
        setLocation(initialData.location || '');
        setImportant(initialData.important || false);
      } else {
        setTitle('');
        setEmoji('⏰');
        setNote('');
        setImage(undefined);
        setLocation('');
        setImportant(false);
      }
    }
  }, [open, initialData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(undefined);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      emoji: emoji || undefined,
      note: note.trim() || undefined,
      image: image || undefined,
      location: location.trim() || undefined,
      important,
    });

    // Reset form
    setTitle('');
    setEmoji('⏰');
    setNote('');
    setImage(undefined);
    setLocation('');
    setImportant(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setEmoji('⏰');
    setNote('');
    setImage(undefined);
    setLocation('');
    setImportant(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Reminder' : 'Create Reminder'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <div className="flex gap-2 items-center">
                {/* Hidden input for emoji keyboard (mobile only) */}
                {isMobile && (
                  <input
                    ref={emojiInputRef}
                    type="text"
                    inputMode="emoji"
                    value={emoji || '⏰'}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Extract emoji from input (take last emoji character if multiple)
                      const emojiMatch = val.match(/[\p{Emoji}]/gu);
                      if (emojiMatch && emojiMatch.length > 0) {
                        setEmoji(emojiMatch[emojiMatch.length - 1]);
                      } else if (val.length === 0) {
                        setEmoji('⏰');
                      }
                    }}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                    maxLength={2}
                  />
                )}
                
                {/* Emoji button - shows popover on desktop, triggers keyboard on mobile */}
                {isMobile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="w-16 h-10 text-2xl flex-shrink-0"
                    onClick={() => {
                      emojiInputRef.current?.focus();
                    }}
                  >
                    {emoji || '⏰'}
                  </Button>
                ) : (
                  <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="w-16 h-10 text-2xl flex-shrink-0"
                      >
                        {emoji || '⏰'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <div className="grid grid-cols-8 gap-2">
                        {commonEmojis.map((emojiOption) => (
                          <button
                            key={emojiOption}
                            type="button"
                            onClick={() => {
                              setEmoji(emojiOption);
                              setEmojiPopoverOpen(false);
                            }}
                            className={`w-8 h-8 rounded-md flex items-center justify-center text-xl hover:bg-muted transition-colors ${
                              emoji === emojiOption ? 'bg-primary text-primary-foreground' : ''
                            }`}
                          >
                            {emojiOption}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Review weekly goals"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
              />
            </div>

            {/* Image/Screenshot */}
            <div className="space-y-2">
              <Label>Image / Screenshot (Optional)</Label>
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Reminder"
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => setShowImageViewer(true)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                </label>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location (Optional)
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Home, Office, Gym"
              />
            </div>

            {/* Importance Flag */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="important" className="flex items-center gap-2 cursor-pointer">
                <Flag className="w-4 h-4" />
                Important
              </Label>
              <Switch
                id="important"
                checked={important}
                onCheckedChange={setImportant}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!title.trim()}
                className="flex-1"
              >
                {initialData ? 'Save Changes' : 'Create Reminder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      {image && (
        <ImageViewerDialog
          images={[image]}
          open={showImageViewer}
          onOpenChange={setShowImageViewer}
        />
      )}
    </>
  );
}

