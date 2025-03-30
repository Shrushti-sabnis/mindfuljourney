import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileNavigation } from "@/components/layout/mobile-nav";
import { DailyMood } from "@/components/dashboard/daily-mood";
import { MoodChart } from "@/components/dashboard/mood-chart";
import { MoodCalendar } from "@/components/dashboard/mood-calendar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Journal, MindfulnessSession } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Play, Pause } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("journal");
  const [playingSession, setPlayingSession] = useState<number | null>(null);

  // Fetch recent journal entries
  const { data: journals, isLoading: journalsLoading } = useQuery<Journal[]>({
    queryKey: ["/api/journals"],
  });

  // Fetch mindfulness sessions
  const { data: mindfulnessSessions, isLoading: sessionsLoading } = useQuery<MindfulnessSession[]>({
    queryKey: ["/api/mindfulness"],
  });

  // Format dates for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  // Get mood emoji
  const getMoodEmoji = (rating: number) => {
    switch(rating) {
      case 5: return "😊";
      case 4: return "😌";
      case 3: return "😐";
      case 2: return "😔";
      case 1: return "😟";
      default: return "😐";
    }
  };

  // Format audio duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minutes`;
  };

  // Toggle audio playback (frontend only)
  const togglePlayback = (sessionId: number) => {
    if (playingSession === sessionId) {
      setPlayingSession(null);
    } else {
      setPlayingSession(sessionId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 pb-16 lg:pb-0">
        <MobileHeader />
        
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold font-heading mb-6">Dashboard</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <DailyMood />
            </div>
            <div className="lg:col-span-2">
              <MoodChart />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-neutral-200">
                <TabsList className="h-auto bg-transparent p-0">
                  <TabsTrigger 
                    value="journal" 
                    className="px-6 py-3 rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    Journal
                  </TabsTrigger>
                  <TabsTrigger 
                    value="calendar" 
                    className="px-6 py-3 rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    Mood Calendar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="mindfulness" 
                    className="px-6 py-3 rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    Mindfulness
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="journal" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium">Recent Journal Entries</h3>
                  <Link href="/journal">
                    <Button variant="default" className="bg-primary hover:bg-primary/90 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      New Entry
                    </Button>
                  </Link>
                </div>
                
                {journalsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                  </div>
                ) : journals?.length === 0 ? (
                  <Card className="bg-neutral-50">
                    <CardContent className="p-6 text-center">
                      <p className="text-neutral-600 mb-4">No journal entries yet.</p>
                      <Link href="/journal">
                        <Button variant="default" className="bg-primary hover:bg-primary/90 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Entry
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {journals?.slice(0, 3).map((journal) => (
                      <Link key={journal.id} href={`/journal?id=${journal.id}`}>
                        <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition cursor-pointer">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{journal.title}</h4>
                            <div className="flex items-center">
                              <span className="text-lg">{getMoodEmoji(journal.mood)}</span>
                              <span className="text-sm text-neutral-500 ml-2">
                                {formatDate(journal.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-neutral-600 line-clamp-2 text-sm mb-3">
                            {journal.content}
                          </p>
                          <div className="flex items-center text-sm text-neutral-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{format(new Date(journal.createdAt), "h:mm a")}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    <div className="text-center mt-4">
                      <Link href="/journal">
                        <Button variant="link" className="text-primary">
                          View All Entries
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="calendar" className="p-0">
                <MoodCalendar />
              </TabsContent>
              
              <TabsContent value="mindfulness" className="p-6">
                <h3 className="text-lg font-medium mb-4">Mindfulness Sessions</h3>
                
                {sessionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-64 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mindfulnessSessions?.filter(s => !s.isPremium).slice(0, 3).map((session) => (
                      <div key={session.id} className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-sm transition">
                        <div className="aspect-w-16 aspect-h-9 h-40 relative">
                          <img 
                            src={session.imageUrl} 
                            alt={session.title} 
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <button 
                              onClick={() => togglePlayback(session.id)}
                              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-opacity-30 transition"
                            >
                              {playingSession === session.id ? (
                                <Pause className="h-6 w-6" />
                              ) : (
                                <Play className="h-6 w-6" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium mb-1">{session.title}</h4>
                          <p className="text-sm text-neutral-600 mb-3">{session.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500">{formatDuration(session.duration)}</span>
                            <div className="h-1 w-32 rounded-full bg-neutral-200"></div>
                            <span className="text-neutral-600">
                              {Math.floor(session.duration / 60)}:
                              {session.duration % 60 < 10 ? '0' : ''}
                              {session.duration % 60}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
                        <div className="w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h4 className="font-medium mb-2">Premium Sessions</h4>
                        <p className="text-sm text-neutral-600 mb-4">
                          Unlock 20+ additional guided meditations and mindfulness exercises.
                        </p>
                        {!user?.isPremium && (
                          <Link href="/subscribe">
                            <Button className="bg-accent hover:bg-accent/90 text-white">
                              Upgrade to Premium
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <MobileNavigation />
      </div>
    </div>
  );
}
