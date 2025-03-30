import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileNavigation } from "@/components/layout/mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { Mood } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyMood } from "@/components/dashboard/daily-mood";
import { MoodChart } from "@/components/dashboard/mood-chart";
import { MoodCalendar } from "@/components/dashboard/mood-calendar";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function MoodPage() {
  const [activeTab, setActiveTab] = useState("tracker");

  // Fetch mood entries
  const { data: moods, isLoading } = useQuery<Mood[]>({
    queryKey: ["/api/moods"],
  });

  // Get mood emoji
  const getMoodEmoji = (rating: number) => {
    switch(rating) {
      case 5: return { emoji: "😊", label: "Great", color: "#4CAF50" };
      case 4: return { emoji: "😌", label: "Good", color: "#9DD9D2" };
      case 3: return { emoji: "😐", label: "Okay", color: "#ADB5BD" };
      case 2: return { emoji: "😔", label: "Low", color: "#88A2D9" };
      case 1: return { emoji: "😟", label: "Rough", color: "#F44336" };
      default: return { emoji: "😐", label: "Okay", color: "#ADB5BD" };
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 pb-16 lg:pb-0">
        <MobileHeader />
        
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold font-heading mb-6">Mood Tracker</h2>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tracker">Daily Tracker</TabsTrigger>
              <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tracker" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <DailyMood />
                </div>
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Recent Mood Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-lg" />
                          ))}
                        </div>
                      ) : moods?.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500">
                          <p>No mood entries yet. Track your first mood above!</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                          {moods?.map((mood) => {
                            const { emoji, label, color } = getMoodEmoji(mood.rating);
                            return (
                              <div key={mood.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className="text-2xl mr-2" style={{ color }}>{emoji}</span>
                                    <span className="font-medium">{label}</span>
                                  </div>
                                  <span className="text-sm text-neutral-500">
                                    {format(new Date(mood.createdAt), "MMM d, h:mm a")}
                                  </span>
                                </div>
                                {mood.note && (
                                  <p className="text-neutral-700 text-sm mt-2">{mood.note}</p>
                                )}
                                <p className="text-xs text-neutral-500 mt-2">
                                  {formatDate(mood.createdAt.toString())}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="trends">
              <div className="grid grid-cols-1 gap-6">
                <MoodChart />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Mood Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {[
                        { title: "Great Days", emoji: "😊", color: "#4CAF50", value: moods?.filter(m => m.rating === 5).length || 0 },
                        { title: "Good Days", emoji: "😌", color: "#9DD9D2", value: moods?.filter(m => m.rating === 4).length || 0 },
                        { title: "Okay Days", emoji: "😐", color: "#ADB5BD", value: moods?.filter(m => m.rating === 3).length || 0 },
                        { title: "Low Days", emoji: "😔", color: "#88A2D9", value: moods?.filter(m => m.rating === 2).length || 0 },
                        { title: "Rough Days", emoji: "😟", color: "#F44336", value: moods?.filter(m => m.rating === 1).length || 0 },
                      ].map((stat) => (
                        <div key={stat.title} className="bg-white rounded-lg p-4 border border-neutral-200 text-center">
                          <span className="text-3xl" style={{ color: stat.color }}>{stat.emoji}</span>
                          <h3 className="text-sm font-medium mt-2">{stat.title}</h3>
                          <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                      <h3 className="text-sm font-medium mb-2">Understanding Your Mood Patterns</h3>
                      <p className="text-sm text-neutral-600">
                        Tracking your mood over time helps identify patterns and triggers. 
                        Look for connections between your activities, sleep, and mood changes 
                        to better understand what affects your mental wellbeing.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar">
              <MoodCalendar />
            </TabsContent>
          </Tabs>
        </div>
        
        <MobileNavigation />
      </div>
    </div>
  );
}
