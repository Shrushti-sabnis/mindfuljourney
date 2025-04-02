import { format } from "date-fns";
import { Journal } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

interface JournalListProps {
  journals: Journal[];
}

export function JournalList({ journals }: JournalListProps) {
  const [_, navigate] = useLocation();

  // Get mood emoji based on mood value
  const getMoodEmoji = (moodValue: number) => {
    switch(moodValue) {
      case 5: return "😊"; // Great
      case 4: return "😌"; // Good
      case 3: return "😐"; // Okay
      case 2: return "😔"; // Low
      case 1: return "😟"; // Rough
      default: return "😐"; // Default
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Journal Entries</h3>
        <Button 
          onClick={() => navigate("/journal/new")}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>
      
      {journals.length === 0 ? (
        <Card className="bg-neutral-50">
          <CardContent className="p-6 text-center">
            <p className="text-neutral-600">No journal entries yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {journals.map((journal) => (
            <div
              key={journal.id}
              onClick={() => navigate(`/journal/${journal.id}`)}
              className="border border-neutral-200 rounded-lg p-4 bg-white hover:shadow-sm transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{journal.title}</h4>
                <div className="flex items-center">
                  <span className="text-lg">{getMoodEmoji(journal.mood)}</span>
                  <span className="text-sm text-neutral-500 ml-2">
                    {format(new Date(journal.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              <p className="text-neutral-600 line-clamp-2 text-sm">
                {journal.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}