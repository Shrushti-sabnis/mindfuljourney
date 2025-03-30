import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { LockIcon } from "lucide-react";

interface JournalPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

// Define a set of basic and premium journal prompts
const basicPrompts = [
  "What are three things you're grateful for today?",
  "Describe one challenge you faced today and how you overcame it.",
  "What made you smile today?",
  "What's something new you learned recently?",
  "Write about an interaction that impacted you today.",
];

const premiumPrompts = [
  "Reflect on a time when you felt truly proud of yourself. What led to that moment?",
  "Explore a fear you have and why it might be holding you back.",
  "What patterns do you notice in your relationships? How might these stem from your early experiences?",
  "If you could give advice to your younger self, what would it be and why?",
  "Describe a belief you've outgrown and how your perspective has evolved.",
  "What aspects of yourself do you find difficult to accept? How might embracing these parts benefit you?",
  "Explore a recurring dream or thought pattern. What might it be trying to tell you?",
];

export function JournalPrompts({ onSelectPrompt }: JournalPromptsProps) {
  const { user } = useAuth();
  const isPremium = user?.isPremium;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Basic Prompts</CardTitle>
          <CardDescription>
            Available to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64 px-4 pb-4">
            <div className="space-y-2">
              {basicPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto whitespace-normal py-2"
                  onClick={() => onSelectPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card className={!isPremium ? "opacity-80" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Deep Reflection Prompts</CardTitle>
            {!isPremium && (
              <div className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs px-2 py-1 rounded-md flex items-center">
                <LockIcon className="h-3 w-3 mr-1" />
                Premium
              </div>
            )}
          </div>
          <CardDescription>
            {isPremium ? "Premium prompts for deeper self-reflection" : "Upgrade to unlock premium prompts"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64 px-4 pb-4">
            <div className="space-y-2">
              {premiumPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto whitespace-normal py-2"
                  onClick={() => onSelectPrompt(prompt)}
                  disabled={!isPremium}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        {!isPremium && (
          <CardFooter className="pt-0 px-6 pb-6">
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => window.location.href = "/subscription"}
            >
              Upgrade to Premium
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}