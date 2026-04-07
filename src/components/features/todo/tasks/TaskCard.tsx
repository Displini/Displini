import React, { useState, memo } from 'react';
import { Task } from '@/types/types';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, ExternalLink, Pencil, Image as ImageIcon, MapPin, Plus, X, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SubtaskTimeline } from './SubtaskTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TaskCardProps {
  task: Task;
  isInGroup?: boolean;
  isOverdue?: boolean;
  onToggle: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  getSourceBadge?: (source: Task["source"]) => { label: string; className: string } | null;
  onSourceShortcut?: (source: Task["source"]) => void;
  onDragStart?: (task: Task, e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: boolean;
}

function TaskCardInner({
  task,
  isInGroup = false,
  isOverdue = false,
  onToggle,
  onEdit,
  onDelete,
  onToggleSubtask,
  getSourceBadge,
  onSourceShortcut,
  onDragStart,
  isDragging = false,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(() => Boolean(task.subtasks?.length));
  const [showAllSubtasks, setShowAllSubtasks] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftTime, setDraftTime] = useState(task.time || "");
  const [draftEndTime, setDraftEndTime] = useState(task.endTime || "");
  const [draftNotes, setDraftNotes] = useState(task.notes || "");
  const [draftEmoji, setDraftEmoji] = useState(task.emoji || "📝");
  const [draftColor, setDraftColor] = useState(task.color || "");
  const [draftAttachments, setDraftAttachments] = useState<string[]>(task.attachments || []);
  const [draftAlerts, setDraftAlerts] = useState<string[]>(task.alertTimes || []);
  const [newAlert, setNewAlert] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const previewSubtasks = task.subtasks?.slice(0, 5) || [];
  const hasAttachments = task.attachments && task.attachments.length > 0;
  
  // Check if task is draggable
  const isDraggable = false; // Drag disabled per request
  
  // Handle click to toggle completion (but allow drag and buttons)
  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    // Only toggle if task is not draggable, or if draggable but not currently dragging
    if (!isDraggable || !isDragging) {
      onToggle(task.id);
    }
  };

  const hasLocation = Boolean(task.location && task.location.trim());

  return (
    <div
      className={`${
        isInGroup 
          ? '' // No styling when in group container - container provides the card styling
          : 'bg-card border border-border shadow-sm rounded-lg p-4 transition-all duration-200 hover:shadow-md' // Full card styling when standalone
      } ${isDragging ? 'opacity-70' : ''}`}
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        ...(task.color && !isInGroup ? { borderLeft: `4px solid ${task.color}` } : {}),
        ...(isInGroup ? { position: 'relative' as const } : {}),
      }}
    >
      {/* Completion bar is rendered in LiquidTimeline with same top/height as candy cone */}
      {/* Main task content – dimmed when completed so completion bar stays full opacity */}
      <div className={task.completed ? 'opacity-60' : ''}>
      {/* Main task content - icons centered vertically on the right */}
      <div className="flex items-stretch gap-3 w-full">
        {/* Task emoji - in colored circle in middle left */}
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: task.color || 'hsl(var(--primary))',
              border: `2px solid ${task.color || 'hsl(var(--primary))'}`,
            }}
          >
            <span className="text-2xl">{task.emoji || '📝'}</span>
          </div>
        </div>
        
        {/* Task details - takes remaining space */}
        <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[3rem]">
          <div className="flex items-center gap-2 relative">
            <h3
              className={`font-semibold flex-1 min-w-0 ${
                task.completed ? 'text-muted-foreground' : ''
              }`}
            >
              {/* Wrap title so strikethrough line only covers text width */}
              <span className="relative inline-block">
                {task.title}
                {task.completed && (
                  <span
                    className="absolute left-0 top-1/2 h-0.5 bg-muted-foreground origin-left"
                    style={{
                      width: '100%',
                      animation: 'lineThrough 0.5s ease-out forwards',
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}
              </span>
            </h3>
          </div>
          
          {/* Time - only show if NOT in group (group container shows time) */}
          {!isInGroup && task.time && (
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.time}
              {task.endTime && ` - ${task.endTime}`}
            </div>
          )}
          
          {/* Source badge */}
          {getSourceBadge && task.source && (() => {
            const badge = getSourceBadge(task.source);
            if (!badge) return null;
            return (
              <Badge variant="secondary" className={`${badge.className} text-xs mt-1`}>
                {badge.label}
              </Badge>
            );
          })()}
          
          {/* Notes */}
          {task.notes && (
            <div className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {task.notes}
            </div>
          )}
          
          {/* Subtask summary */}
          {hasSubtasks && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>
                  {completedSubtasks}/{totalSubtasks} subtasks
                </span>
              </button>
              {totalSubtasks > 5 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllSubtasks(true);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: location, photo, edit - vertically centered */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {hasLocation && (
            <span
              className="text-muted-foreground flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted/80"
              title={task.location}
            >
              <MapPin className="w-4 h-4" />
            </span>
          )}
          {hasAttachments && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowImagePreview(true);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              title={`${task.attachments!.length} photo(s)`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              title="Edit task"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded subtasks */}
      {hasSubtasks && isExpanded && onToggleSubtask && (
        <div className="mt-4">
          <SubtaskTimeline
            subtasks={previewSubtasks}
            onToggleSubtask={(subtaskId) => {
              onToggleSubtask(task.id, subtaskId);
            }}
          />
          {totalSubtasks > 5 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Showing first 5 subtasks
            </div>
          )}
        </div>
      )}
      </div>

      {/* Full subtasks dialog */}
      <Dialog open={showAllSubtasks} onOpenChange={setShowAllSubtasks}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subtasks for {task.title}</DialogTitle>
          </DialogHeader>
          {onToggleSubtask && task.subtasks && (
            <div className="mt-2">
              <SubtaskTimeline
                subtasks={task.subtasks}
                onToggleSubtask={(subtaskId) => {
                  onToggleSubtask(task.id, subtaskId);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit task dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (open) {
          setDraftTitle(task.title);
          setDraftTime(task.time || "");
          setDraftEndTime(task.endTime || "");
          setDraftNotes(task.notes || "");
          setDraftEmoji(task.emoji || "📝");
          setDraftColor(task.color || "");
          setDraftAttachments(task.attachments || []);
          setDraftAlerts(task.alertTimes || []);
          setNewAlert("");
          setAttachmentError("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-emoji">Emoji</Label>
                <Input
                  id="edit-emoji"
                  value={draftEmoji}
                  onChange={(e) => setDraftEmoji(e.target.value || "📝")}
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={draftColor || '#7c3aed'}
                  onChange={(e) => setDraftColor(e.target.value)}
                  className="w-16 p-1"
                />
                <Input
                  value={draftColor}
                  onChange={(e) => setDraftColor(e.target.value)}
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-time">Start time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={draftTime}
                  onChange={(e) => setDraftTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-endtime">End time</Label>
                <Input
                  id="edit-endtime"
                  type="time"
                  value={draftEndTime}
                  onChange={(e) => setDraftEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>Attachments</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {draftAttachments.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-border bg-muted">
                    <img src={img} alt={`attachment-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-[2px] hover:bg-background"
                      onClick={() => setDraftAttachments(draftAttachments.filter((_, i) => i !== idx))}
                      aria-label="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 border border-dashed border-border rounded-md flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        setAttachmentError("Only images are allowed");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = reader.result as string;
                        setDraftAttachments(prev => [...prev, base64]);
                        setAttachmentError("");
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <Plus className="w-4 h-4" />
                </label>
              </div>
              {attachmentError && <p className="text-xs text-destructive mt-1">{attachmentError}</p>}
            </div>
            <div>
              <Label>Alerts</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="time"
                  value={newAlert}
                  onChange={(e) => setNewAlert(e.target.value)}
                  className="max-w-[140px]"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-md border"
                  onClick={() => {
                    if (newAlert && !draftAlerts.includes(newAlert)) {
                      setDraftAlerts([...draftAlerts, newAlert].sort());
                      setNewAlert("");
                    }
                  }}
                  disabled={!newAlert}
                >
                  Add
                </button>
              </div>
              {draftAlerts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {draftAlerts.map((a) => (
                    <span key={a} className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs">
                      {a}
                      <button
                        type="button"
                        aria-label="Remove alert"
                        onClick={() => setDraftAlerts(draftAlerts.filter(t => t !== a))}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              {onDelete ? (
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm text-destructive hover:underline"
                  onClick={() => {
                    setEditOpen(false);
                    onDelete(task.id);
                  }}
                  aria-label="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete task
                </button>
              ) : <span />}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-md border"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground"
                  onClick={() => {
                    if (onEdit) {
                      onEdit({
                        ...task,
                        title: draftTitle.trim() || task.title,
                        time: draftTime || undefined,
                        endTime: draftEndTime || undefined,
                        notes: draftNotes.trim() || undefined,
                        emoji: draftEmoji || "📝",
                        color: draftColor || undefined,
                        attachments: draftAttachments.length ? draftAttachments : undefined,
                        alertTimes: draftAlerts.length ? draftAlerts : undefined,
                      });
                    }
                    setEditOpen(false);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attachments</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {task.attachments?.map((img, idx) => (
              <div key={idx} className="w-full rounded-lg overflow-hidden border border-border bg-muted">
                <img src={img} alt={`attachment-${idx}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Memoized so we only re-render when task (or other props) change – not when the timeline clock updates every second. Lets the completion fill CSS animation run without being reset. */
export const TaskCard = memo(TaskCardInner);
