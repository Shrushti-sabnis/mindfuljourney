import { useState } from "react";
import { format } from "date-fns";
import { Journal } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { EditJournalForm } from "./edit-journal-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, AlertCircle, Loader2 } from "lucide-react";

interface JournalViewProps {
  journal: Journal;
}

export function JournalView({ journal }: JournalViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Delete journal mutation
  const deleteJournalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/journals/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete journal");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Journal Deleted",
        description: "Your journal entry has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      navigate("/journal");
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Journal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const getMoodLabel = (moodValue: number) => {
    switch(moodValue) {
      case 5: return "Great";
      case 4: return "Good";
      case 3: return "Okay";
      case 2: return "Low";
      case 1: return "Rough";
      default: return "Okay";
    }
  };

  const handleDelete = () => {
    deleteJournalMutation.mutate(journal.id);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Journal Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <EditJournalForm 
            journal={journal} 
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{journal.title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                    Confirm Deletion
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this journal entry? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={deleteJournalMutation.isPending}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {deleteJournalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="flex items-center mt-2 text-muted-foreground text-sm">
          <div className="flex items-center mr-4">
            <span className="text-xl mr-1">{getMoodEmoji(journal.mood)}</span>
            <span>{getMoodLabel(journal.mood)}</span>
          </div>
          <span>
            {format(new Date(journal.createdAt), "MMM d, yyyy • h:mm a")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{journal.content}</p>
      </CardContent>
    </Card>
  );
}