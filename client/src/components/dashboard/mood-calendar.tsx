import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Mood } from "@shared/schema";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths, 
  getDay 
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function MoodCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysWithMood, setDaysWithMood] = useState<Record<string, Mood>>({});
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate offset for first day of month
  const startDay = getDay(monthStart);
  
  // Query mood data for the current month
  const { data: moods, isLoading } = useQuery<Mood[]>({
    queryKey: ["/api/moods/range", { startDate: monthStart.toISOString(), endDate: monthEnd.toISOString() }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const response = await fetch(`/api/moods/range?startDate=${params.startDate}&endDate=${params.endDate}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch mood data");
      }
      return response.json();
    },
  });
  
  useEffect(() => {
    if (!moods) return;
    
    // Group moods by day, if multiple moods in a day, use the last one recorded
    const moodsByDay: Record<string, Mood> = {};
    
    // Sort moods by createdAt date in descending order (newest first)
    const sortedMoods = [...moods].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    sortedMoods.forEach((mood) => {
      const dateStr = format(new Date(mood.createdAt), "yyyy-MM-dd");
      if (!moodsByDay[dateStr]) {
        moodsByDay[dateStr] = mood;
      }
    });
    
    setDaysWithMood(moodsByDay);
  }, [moods]);
  
  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const getMoodEmoji = (rating: number) => {
    switch(rating) {
      case 5: return { emoji: "😊", color: "#4CAF50" }; // Great
      case 4: return { emoji: "😌", color: "#9DD9D2" }; // Good
      case 3: return { emoji: "😐", color: "#ADB5BD" }; // Okay
      case 2: return { emoji: "😔", color: "#88A2D9" }; // Low
      case 1: return { emoji: "😟", color: "#F44336" }; // Rough
      default: return { emoji: "", color: "transparent" };
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {format(currentDate, "MMMM yyyy")}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={previousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-sm font-medium text-neutral-600">
              {day}
            </div>
          ))}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before the start of the month */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-start-${i}`} className="h-14"></div>
            ))}
            
            {/* Days of the month */}
            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const mood = daysWithMood[dateStr];
              const { emoji, color } = mood ? getMoodEmoji(mood.rating) : { emoji: "", color: "transparent" };
              
              return (
                <div 
                  key={dateStr}
                  className={`flex flex-col items-center justify-center border rounded-lg p-2 h-14 ${
                    isToday(day) ? "border-primary bg-primary/5" : "bg-white"
                  } ${!isSameMonth(day, currentDate) ? "text-neutral-300" : ""}`}
                >
                  <span className="text-xs text-neutral-600">{format(day, "d")}</span>
                  {mood && (
                    <span className="text-lg" style={{ color }}>
                      {emoji}
                    </span>
                  )}
                </div>
              );
            })}
            
            {/* Empty cells for days after the end of the month */}
            {Array.from({ length: (7 - ((daysInMonth.length + startDay) % 7)) % 7 }).map((_, i) => (
              <div key={`empty-end-${i}`} className="h-14"></div>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap justify-center mt-6 gap-3">
          {[
            { label: "Great", color: "#4CAF50", emoji: "😊" },
            { label: "Good", color: "#9DD9D2", emoji: "😌" },
            { label: "Okay", color: "#ADB5BD", emoji: "😐" },
            { label: "Low", color: "#88A2D9", emoji: "😔" },
            { label: "Rough", color: "#F44336", emoji: "😟" },
          ].map(({ label, color, emoji }) => (
            <div key={label} className="flex items-center">
              <span 
                className="inline-block w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: color }}
              ></span>
              <span className="text-sm text-neutral-600">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
