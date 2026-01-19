import { UniversalDialog } from "@/components/general";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { CheckCircle2, Circle, Utensils, Heart, Dumbbell, Calendar as CalendarIcon, ListTodo, Droplet } from "lucide-react";

interface MonthlyStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MonthlyStatsModal({ open, onOpenChange }: MonthlyStatsModalProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const todos = JSON.parse(localStorage.getItem("todos") || "[]");
  const meals = JSON.parse(localStorage.getItem("meals") || "[]");
  const medications = JSON.parse(localStorage.getItem("medications") || "[]");
  const workouts = JSON.parse(localStorage.getItem("workouts") || "[]");
  const calendarEvents = JSON.parse(localStorage.getItem("calendarEvents") || "[]");
  const waterEntries = JSON.parse(localStorage.getItem("water_entries") || "[]");

  const completedTodos = todos.filter((t: any) => t.completed).length;
  const totalTodos = todos.length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const mealsThisMonth = meals.filter((m: any) => {
    if (!m.consumedAt) return false;
    const consumedDate = new Date(m.consumedAt);
    return consumedDate >= monthStart && consumedDate <= monthEnd;
  }).length;

  const totalProteinThisMonth = meals
    .filter((m: any) => {
      if (!m.consumedAt) return false;
      const consumedDate = new Date(m.consumedAt);
      return consumedDate >= monthStart && consumedDate <= monthEnd;
    })
    .reduce((sum: number, m: any) => sum + (m.protein || 0), 0);

  const waterEntriesThisMonth = waterEntries.filter((e: any) => {
    const entryDate = new Date(e.date);
    return entryDate >= monthStart && entryDate <= monthEnd;
  });

  const totalWaterThisMonth = waterEntriesThisMonth.reduce((sum: number, e: any) => {
    const amountInMl = e.unit === 'oz' ? e.amount * 29.5735 : e.amount;
    return sum + amountInMl;
  }, 0);

  const medicationsThisMonth = medications.filter((m: any) => {
    if (!m.lastTaken) return false;
    const takenDate = new Date(m.lastTaken);
    return takenDate >= monthStart && takenDate <= monthEnd;
  }).length;

  const workoutsThisMonth = workouts.filter((w: any) => {
    const workoutTodos = todos.filter((t: any) => t.source === 'workout' && t.workoutId === w.id && t.completed);
    return workoutTodos.some((t: any) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= monthStart && dueDate <= monthEnd;
    });
  }).length;

  const eventsThisMonth = calendarEvents.filter((e: any) => {
    const eventDate = new Date(e.date);
    return eventDate >= monthStart && eventDate <= monthEnd;
  }).length;

  return (
    <UniversalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Monthly Statistics - ${format(now, 'MMMM yyyy')}`}
      scrollable={true}
    >

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="food" data-testid="tab-food">Food</TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-health">Health</TabsTrigger>
            <TabsTrigger value="sport" data-testid="tab-sport">Sport</TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar</TabsTrigger>
            <TabsTrigger value="todo" data-testid="tab-todo">To Do</TabsTrigger>
            <TabsTrigger value="water" data-testid="tab-water">Water</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    Food
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-meals-count">{mealsThisMonth}</div>
                  <p className="text-xs text-muted-foreground">Meals logged</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-medications-count">{medicationsThisMonth}</div>
                  <p className="text-xs text-muted-foreground">Medications taken</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    Sport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-workouts-count">{workoutsThisMonth}</div>
                  <p className="text-xs text-muted-foreground">Workouts completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-events-count">{eventsThisMonth}</div>
                  <p className="text-xs text-muted-foreground">Events scheduled</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    To Do
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-completion-rate">{completionRate}%</div>
                  <p className="text-xs text-muted-foreground">{completedTodos}/{totalTodos} completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplet className="w-4 h-4" />
                    Water
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-water-total">{Math.round(totalWaterThisMonth / 1000)}</div>
                  <p className="text-xs text-muted-foreground">Liters tracked</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="food" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Food Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Meals Logged</p>
                  <p className="text-3xl font-bold" data-testid="food-meals-total">{mealsThisMonth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Protein</p>
                  <p className="text-3xl font-bold" data-testid="food-protein-total">{Math.round(totalProteinThisMonth)}g</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Protein per Day</p>
                  <p className="text-3xl font-bold" data-testid="food-protein-avg">
                    {Math.round(totalProteinThisMonth / daysInMonth.length)}g
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Medications Taken</p>
                  <p className="text-3xl font-bold" data-testid="health-medications-total">{medicationsThisMonth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Medications</p>
                  <p className="text-3xl font-bold" data-testid="health-medications-active">{medications.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sport" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sport Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Workouts Completed</p>
                  <p className="text-3xl font-bold" data-testid="sport-workouts-total">{workoutsThisMonth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Workout Plans</p>
                  <p className="text-3xl font-bold" data-testid="sport-workouts-active">{workouts.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendar Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Events Scheduled</p>
                  <p className="text-3xl font-bold" data-testid="calendar-events-total">{eventsThisMonth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-3xl font-bold" data-testid="calendar-events-all">{calendarEvents.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>To Do Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold" data-testid="todo-completion-rate">{completionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Tasks</p>
                  <p className="text-3xl font-bold" data-testid="todo-completed-total">{completedTodos}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-3xl font-bold" data-testid="todo-tasks-total">{totalTodos}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="water" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Water Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Water Consumed</p>
                  <p className="text-3xl font-bold" data-testid="water-total-liters">{(totalWaterThisMonth / 1000).toFixed(1)}L</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average per Day</p>
                  <p className="text-3xl font-bold" data-testid="water-avg-daily">
                    {(totalWaterThisMonth / 1000 / daysInMonth.length).toFixed(1)}L
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-3xl font-bold" data-testid="water-entries-total">{waterEntriesThisMonth.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </UniversalDialog>
  );
}
