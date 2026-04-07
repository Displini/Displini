import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, ExternalLink } from "lucide-react";
import { Task } from "@/types/types";
import { format } from "date-fns";

interface Props {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  getSourceBadge: (source: Task["source"]) => { label: string; className: string } | null;
  onOpenWorkDialog?: () => void;
}

export default function AllDayTasks({ tasks, onToggleTask, onEditTask, onDeleteTask, getSourceBadge, onOpenWorkDialog }: Props) {
  
  const formatCompletionTime = (completedAt: string | Date) => {
    const date = completedAt instanceof Date ? completedAt : new Date(completedAt);
    return format(date, "HH:mm");
  };

  return (
    <div className="space-y-3 w-full max-w-lg mx-auto">
      <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
        {tasks.map(task => {
          const badge = getSourceBadge(task.source || "manual");
          return (
            <div key={task.id} className="flex flex-col items-center gap-2 min-w-fit">
              <div className="relative">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${
                    task.completed 
                      ? "" 
                      : "hover-elevate active:scale-95"
                  }`}
                  style={
                    task.completed
                      ? {
                          backgroundColor: task.color ? task.color : 'hsl(var(--primary))',
                          opacity: 1,
                        }
                      : task.color
                        ? { backgroundColor: 'transparent', border: `2px solid ${task.color}` }
                        : { backgroundColor: 'transparent', border: '2px solid hsl(var(--primary) / 0.5)' }
                  }
                >
                  {task.emoji || ""}
                </button>
                {/* Completion time - top right of circle */}
                {task.completed && task.completedAt && (
                  <div 
                    className="absolute -top-0.5 -right-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-md z-10 whitespace-nowrap"
                    style={task.color ? { backgroundColor: task.color } : { backgroundColor: 'hsl(var(--primary))' }}
                  >
                    {formatCompletionTime(task.completedAt)}
                  </div>
                )}
              </div>
              <p className={`text-xs font-medium text-center max-w-24 truncate ${task.completed ? "line-through opacity-60" : ""}`}>
                {task.title}
              </p>
              {badge && <Badge variant="secondary" className={badge.className}>{badge.label}</Badge>}
              <div className="flex items-center gap-1">
                {/* For salary tasks, show only shortcut to open Work dialog */}
                {task.source === 'salary' && onOpenWorkDialog ? (
                  <Button 
                    variant="ghost" 
                    className="h-6 w-6 p-0" 
                    onClick={onOpenWorkDialog}
                    title="Open Work Settings"
                  >
                    <ExternalLink className="w-3 h-3 text-primary" />
                  </Button>
                ) : 
                /* For medication tasks, hide edit button */
                task.source === 'medication' ? (
                  null
                ) : (
                  <>
                    {onEditTask && (
                      <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => onEditTask(task)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}