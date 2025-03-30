import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface MoodEmoji {
  emoji: string;
  label: string;
  value: number;
}

const moods: MoodEmoji[] = [
  { emoji: "😊", label: "Great", value: 5 },
  { emoji: "😌", label: "Good", value: 4 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😔", label: "Low", value: 2 },
  { emoji: "😟", label: "Rough", value: 1 },
];

export function DailyMood() {
  const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const moodMutation = useMutation({
    mutationFn: async (data: { rating: number; note: string }) => {
      const response = await apiRequest("POST", "/api/moods", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mood saved",
        description: "Your mood has been recorded successfully.",
      });
      setSelectedMood(null);
      setNote("");
      // Invalidate moods queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save mood",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMoodSelect = (mood: MoodEmoji) => {
    setSelectedMood(mood);
  };

  const handleSaveMood = () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose how you're feeling before saving.",
        variant: "destructive",
      });
      return;
    }

    moodMutation.mutate({
      rating: selectedMood.value,
      note: note.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How are you feeling today?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodSelect(mood)}
              className={`flex flex-col items-center p-2 rounded-lg transition ${
                selectedMood?.value === mood.value
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-neutral-100"
              }`}
            >
              <span className="text-2xl mb-1">{mood.emoji}</span>
              <span className="text-xs text-neutral-600">{mood.label}</span>
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="mood-note" className="block text-sm font-medium text-neutral-700 mb-1">
            Add a note
          </label>
          <Textarea
            id="mood-note"
            placeholder="What's influencing your mood today?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveMood} 
          className="bg-primary hover:bg-primary/90 text-white" 
          disabled={moodMutation.isPending}
        >
          {moodMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Mood"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
