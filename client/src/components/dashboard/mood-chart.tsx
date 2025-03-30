import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Mood } from "@shared/schema";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock } from "lucide-react";

export function MoodChart() {
  const [chartData, setChartData] = useState<any[]>([]);

  // Get moods for the last 7 days
  const today = new Date();
  const startDate = startOfDay(subDays(today, 6)); // 7 days ago
  const endDate = endOfDay(today);

  const { data: moods, isLoading } = useQuery<Mood[]>({
    queryKey: ["/api/moods/range", { startDate: startDate.toISOString(), endDate: endDate.toISOString() }],
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

    // Process moods into chart data
    const days: Record<string, any> = {};
    
    // Initialize days for last 7 days
    for (let i = 0; i < 7; i++) {
      const date = subDays(today, 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      days[dateStr] = {
        date: dateStr,
        day: format(date, "EEE"),
        moodValue: null,
        count: 0,
      };
    }
    
    // Add mood data to days
    moods.forEach((mood) => {
      const date = format(new Date(mood.createdAt), "yyyy-MM-dd");
      if (days[date]) {
        // If multiple moods in a day, calculate average
        const currentValue = days[date].moodValue || 0;
        const currentCount = days[date].count || 0;
        days[date].moodValue = (currentValue * currentCount + mood.rating) / (currentCount + 1);
        days[date].count += 1;
      }
    });
    
    // Convert to array and sort by date
    const chartDataArray = Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
    setChartData(chartDataArray);
  }, [moods, today]);

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const moodValue = payload[0].value;
      let moodText = "No data";
      
      if (moodValue !== null) {
        if (moodValue >= 4.5) moodText = "Great";
        else if (moodValue >= 3.5) moodText = "Good";
        else if (moodValue >= 2.5) moodText = "Okay";
        else if (moodValue >= 1.5) moodText = "Low";
        else moodText = "Rough";
      }
      
      return (
        <div className="bg-white p-2 border rounded shadow text-xs">
          <p className="font-medium">{payload[0].payload.day}</p>
          <p>{moodText}: {moodValue !== null ? moodValue.toFixed(1) : "N/A"}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Weekly Mood Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="day"
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                domain={[1, 5]} 
                ticks={[1, 2, 3, 4, 5]} 
                tick={{ fontSize: 12 }} 
                tickMargin={10}
              />
              <Tooltip content={customTooltip} />
              <ReferenceLine y={3} stroke="#ced4da" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="moodValue"
                stroke="#4A6FA5"
                strokeWidth={2}
                dot={{ r: 4, fill: "#4A6FA5" }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-neutral-600 space-x-4">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-primary rounded-full mr-1"></span>
          <span>Mood Level</span>
        </div>
        <div className="flex items-center">
          <span className="text-xs">1 = Rough</span>
          <span className="mx-1">→</span>
          <span className="text-xs">5 = Great</span>
        </div>
      </CardFooter>
    </Card>
  );
}
