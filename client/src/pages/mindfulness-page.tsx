import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileNavigation } from "@/components/layout/mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { MindfulnessSession } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Lock } from "lucide-react";

export default function MindfulnessPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [activeSession, setActiveSession] = useState<number | null>(null);
  
  // Fetch mindfulness sessions
  const { data: sessions, isLoading } = useQuery<MindfulnessSession[]>({
    queryKey: ["/api/mindfulness"],
  });
  
  // Format duration in minutes
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };
  
  // Filter sessions based on active tab
  const filteredSessions = sessions?.filter(session => {
    if (activeTab === "all") return true;
    if (activeTab === "free") return !session.isPremium;
    if (activeTab === "premium") return session.isPremium;
    return true;
  });
  
  // Toggle audio playback
  const togglePlayback = (sessionId: number) => {
    if (activeSession === sessionId) {
      setActiveSession(null);
    } else {
      setActiveSession(sessionId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 pb-16 lg:pb-0">
        <MobileHeader />
        
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold font-heading mb-6">Mindfulness</h2>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-6 md:p-8 bg-gradient-to-r from-primary to-primary-light text-white">
              <div className="max-w-3xl">
                <h3 className="text-xl md:text-2xl font-semibold mb-3">Practice Mindfulness Daily</h3>
                <p className="text-white/90 mb-4">
                  Mindfulness practice can help reduce stress, enhance focus, and improve emotional wellbeing.
                  Listen to guided sessions designed to help you cultivate a more present and peaceful mind.
                </p>
                {!user?.isPremium && (
                  <Link href="/subscribe">
                    <Button className="bg-white text-primary hover:bg-white/90">
                      Upgrade for Premium Sessions
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All Sessions</TabsTrigger>
                <TabsTrigger value="free">Free</TabsTrigger>
                <TabsTrigger value="premium">Premium</TabsTrigger>
              </TabsList>
              
              {activeTab === "premium" && !user?.isPremium && (
                <Link href="/subscribe">
                  <Button className="bg-accent hover:bg-accent/90 text-white">
                    Unlock Premium
                  </Button>
                </Link>
              )}
            </div>
            
            <TabsContent value="all" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                  ))
                ) : (
                  filteredSessions?.map((session) => (
                    <Card key={session.id} className="overflow-hidden">
                      <div className="relative h-40">
                        <img
                          src={session.imageUrl}
                          alt={session.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          {session.isPremium && !user?.isPremium ? (
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 text-white">
                              <Lock className="h-6 w-6" />
                            </div>
                          ) : (
                            <button
                              onClick={() => togglePlayback(session.id)}
                              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-opacity-30 transition"
                            >
                              {activeSession === session.id ? (
                                <Pause className="h-6 w-6" />
                              ) : (
                                <Play className="h-6 w-6" />
                              )}
                            </button>
                          )}
                        </div>
                        {session.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-accent hover:bg-accent">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1">{session.title}</h3>
                        <p className="text-sm text-neutral-600 mb-3">{session.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-500">{formatDuration(session.duration)}</span>
                        </div>
                        
                        {activeSession === session.id && !(session.isPremium && !user?.isPremium) && (
                          <div className="mt-4">
                            <AudioPlayer 
                              src={session.audioUrl} 
                              title={session.title} 
                              duration={session.duration}
                            />
                          </div>
                        )}
                        
                        {session.isPremium && !user?.isPremium && (
                          <div className="mt-4">
                            <Link href="/subscribe">
                              <Button className="w-full bg-accent hover:bg-accent/90 text-white text-sm">
                                Unlock Premium Content
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="free" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                  ))
                ) : filteredSessions?.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-neutral-500">No free sessions available.</p>
                  </div>
                ) : (
                  filteredSessions?.map((session) => (
                    <Card key={session.id} className="overflow-hidden">
                      <div className="relative h-40">
                        <img
                          src={session.imageUrl}
                          alt={session.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <button
                            onClick={() => togglePlayback(session.id)}
                            className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-opacity-30 transition"
                          >
                            {activeSession === session.id ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6" />
                            )}
                          </button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1">{session.title}</h3>
                        <p className="text-sm text-neutral-600 mb-3">{session.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-500">{formatDuration(session.duration)}</span>
                        </div>
                        
                        {activeSession === session.id && (
                          <div className="mt-4">
                            <AudioPlayer 
                              src={session.audioUrl} 
                              title={session.title} 
                              duration={session.duration}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="premium" className="space-y-6">
              {!user?.isPremium ? (
                <Card className="text-center p-6">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Premium Content Locked</h3>
                    <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                      Upgrade to premium to access our exclusive mindfulness sessions, deep reflection prompts, and advanced analytics.
                    </p>
                    <Link href="/subscribe">
                      <Button className="bg-accent hover:bg-accent/90 text-white">
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredSessions?.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-neutral-500">No premium sessions available at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSessions?.map((session) => (
                    <Card key={session.id} className="overflow-hidden">
                      <div className="relative h-40">
                        <img
                          src={session.imageUrl}
                          alt={session.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <button
                            onClick={() => togglePlayback(session.id)}
                            className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 text-white hover:bg-opacity-30 transition"
                          >
                            {activeSession === session.id ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6" />
                            )}
                          </button>
                        </div>
                        <Badge className="absolute top-2 right-2 bg-accent hover:bg-accent">
                          Premium
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1">{session.title}</h3>
                        <p className="text-sm text-neutral-600 mb-3">{session.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-500">{formatDuration(session.duration)}</span>
                        </div>
                        
                        {activeSession === session.id && (
                          <div className="mt-4">
                            <AudioPlayer 
                              src={session.audioUrl} 
                              title={session.title} 
                              duration={session.duration}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium mb-4">Benefits of Mindfulness Practice</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Reduced Stress</h4>
                <p className="text-sm text-neutral-600">
                  Regular mindfulness practice can lower cortisol levels and help manage stress responses.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Improved Focus</h4>
                <p className="text-sm text-neutral-600">
                  Training your mind to stay present can enhance concentration and productivity.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Emotional Balance</h4>
                <p className="text-sm text-neutral-600">
                  Mindfulness helps create space between emotions and reactions, leading to better emotional regulation.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <MobileNavigation />
      </div>
    </div>
  );
}
