import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface JournalPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function JournalPrompts({ onSelectPrompt }: JournalPromptsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("daily");
  const isPremium = user?.isPremium;

  // Basic prompts available to all users
  const dailyPrompts = [
    "How am I feeling today and why?",
    "What are three things I'm grateful for today?",
    "What was the best part of my day so far?",
    "What is something I could have done better today?",
    "What is one thing I accomplished today?",
    "What is something I'm looking forward to tomorrow?",
  ];

  const reflectionPrompts = [
    "What has been on my mind lately?",
    "What made me smile today?",
    "What is something challenging I faced recently?",
    "What are my goals for this week?",
    "How am I taking care of myself today?",
    "What is something I learned today?",
  ];

  // Premium "deep reflection" prompts
  const emotionalPrompts = [
    "Describe a time when I felt strong emotions. What triggered them and how did I respond?",
    "How do I typically handle difficult emotions? Are there better ways I could respond?",
    "When do I feel most at peace? What elements create that feeling?",
    "What aspects of my emotional well-being would I like to improve, and how might I do that?",
    "What patterns do I notice in my emotional responses? Are they serving me well?",
  ];

  const growthPrompts = [
    "What limiting beliefs might be holding me back from my full potential?",
    "Reflect on a recent challenge. What did it teach me about myself?",
    "What does personal growth mean to me right now? What areas am I focusing on?",
    "What would I do differently if I weren't afraid of failure?",
    "How have my priorities shifted over the past year, and what does that reveal about my values?",
  ];

  const renderPromptList = (prompts: string[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((prompt, index) => (
          <Card 
            key={index} 
            className="hover:shadow-sm cursor-pointer transition bg-white border-neutral-200"
            onClick={() => onSelectPrompt(prompt)}
          >
            <CardContent className="p-3 text-sm">
              <p>{prompt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderPremiumLock = () => {
    return (
      <div className="text-center py-6 px-4">
        <div className="mb-4 text-amber-500 font-semibold">
          ✨ Premium Feature ✨
        </div>
        <p className="text-neutral-600 mb-4">
          Unlock deep reflection prompts and more advanced journaling tools with a premium subscription.
        </p>
        <Button 
          onClick={() => window.location.href = "/subscription"}
          className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white"
        >
          Upgrade to Premium
        </Button>
      </div>
    );
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="daily" className="flex-1">Daily</TabsTrigger>
          <TabsTrigger value="reflection" className="flex-1">Reflection</TabsTrigger>
          <TabsTrigger value="emotional" className="flex-1">Emotional</TabsTrigger>
          <TabsTrigger value="growth" className="flex-1">Growth</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="mt-0">
          {renderPromptList(dailyPrompts)}
        </TabsContent>
        
        <TabsContent value="reflection" className="mt-0">
          {renderPromptList(reflectionPrompts)}
        </TabsContent>
        
        <TabsContent value="emotional" className="mt-0">
          {isPremium ? renderPromptList(emotionalPrompts) : renderPremiumLock()}
        </TabsContent>
        
        <TabsContent value="growth" className="mt-0">
          {isPremium ? renderPromptList(growthPrompts) : renderPremiumLock()}
        </TabsContent>
      </Tabs>
    </div>
  );
}