import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileNavigation } from "@/components/layout/mobile-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Journal } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Plus, Edit, Trash2, AlertCircle, ArrowLeft, Loader2, Lightbulb, X } from "lucide-react";

import { JournalPrompts } from "@/components/journal/journal-prompts";

export default function JournalPage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const journalId = params.get("id");
  
  const [isEditing, setIsEditing] = useState(!journalId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("3");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  
  const { toast } = useToast();

  // Fetch all journals
  const { data: journals, isLoading: journalsLoading } = useQuery<Journal[]>({
    queryKey: ["/api/journals"],
  });

  // Fetch single journal if ID is provided
  const { data: journal, isLoading: journalLoading } = useQuery<Journal>({
    queryKey: ["/api/journals", journalId],
    enabled: !!journalId,
  });

  // Create journal mutation
  const createJournalMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; mood: number }) => {
      try {
        // First ensure we have authentication by checking user endpoint
        await apiRequest("GET", "/api/user");
        
        // Then try to create the journal
        const response = await apiRequest("POST", "/api/journals", data);
        return await response.json();
      } catch (error) {
        console.error("Error creating journal:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Journal created",
        description: "Your journal entry has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      navigate(`/journal?id=${data.id}`);
      setIsEditing(false);
    },
    onError: (error: Error) => {
      console.error("Journal mutation error:", error);
      
      // If it's an authentication error, redirect to login
      if (error.message.includes("401")) {
        toast({
          title: "Authentication required",
          description: "Please login to create a journal entry.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      toast({
        title: "Failed to create journal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update journal mutation
  const updateJournalMutation = useMutation({
    mutationFn: async (data: { id: number; title: string; content: string; mood: number }) => {
      try {
        // First check authentication
        await apiRequest("GET", "/api/user");
        
        // Then update the journal
        const response = await apiRequest("PUT", `/api/journals/${data.id}`, {
          title: data.title,
          content: data.content,
          mood: data.mood,
        });
        return await response.json();
      } catch (error) {
        console.error("Error updating journal:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Journal updated",
        description: "Your journal entry has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journals", journalId] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      console.error("Journal update error:", error);
      
      // If it's an authentication error, redirect to login
      if (error.message.includes("401")) {
        toast({
          title: "Authentication required",
          description: "Please login to update a journal entry.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      toast({
        title: "Failed to update journal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete journal mutation
  const deleteJournalMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        // First check authentication
        await apiRequest("GET", "/api/user");
        
        // Then delete the journal
        await apiRequest("DELETE", `/api/journals/${id}`);
      } catch (error) {
        console.error("Error deleting journal:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Journal deleted",
        description: "Your journal entry has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      navigate("/journal");
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error("Journal deletion error:", error);
      
      // If it's an authentication error, redirect to login
      if (error.message.includes("401")) {
        toast({
          title: "Authentication required",
          description: "Please login to delete a journal entry.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      toast({
        title: "Failed to delete journal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize form with journal data
  useEffect(() => {
    if (journal) {
      setTitle(journal.title);
      setContent(journal.content);
      setMood(journal.mood.toString());
    } else if (!journalId) {
      // Clear form for new journal
      setTitle("");
      setContent("");
      setMood("3");
    }
  }, [journal, journalId]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your journal entry.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your journal entry.",
        variant: "destructive",
      });
      return;
    }

    if (journalId) {
      updateJournalMutation.mutate({
        id: parseInt(journalId),
        title,
        content,
        mood: parseInt(mood),
      });
    } else {
      createJournalMutation.mutate({
        title,
        content,
        mood: parseInt(mood),
      });
    }
  };

  const handleDelete = () => {
    if (journalId) {
      deleteJournalMutation.mutate(parseInt(journalId));
    }
  };

  const handleCancel = () => {
    if (journalId) {
      // Reset to original values
      if (journal) {
        setTitle(journal.title);
        setContent(journal.content);
        setMood(journal.mood.toString());
      }
      setIsEditing(false);
      setShowPrompts(false);
    } else {
      // Return to journal list
      navigate("/journal");
    }
  };
  
  const handlePromptSelect = (prompt: string) => {
    // If content is empty, just set it to the prompt
    if (!content.trim()) {
      setContent(prompt);
    } else {
      // Otherwise, append the prompt to the existing content with a line break
      setContent(prevContent => `${prevContent}\n\n${prompt}`);
    }
    setShowPrompts(false);
    
    // Focus the textarea after adding the prompt
    setTimeout(() => {
      const textarea = document.getElementById("content") as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        // Place cursor at the end
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
      }
    }, 100);
  };

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

  const moodOptions = [
    { value: "5", label: "Great", emoji: "😊" },
    { value: "4", label: "Good", emoji: "😌" },
    { value: "3", label: "Okay", emoji: "😐" },
    { value: "2", label: "Low", emoji: "😔" },
    { value: "1", label: "Rough", emoji: "😟" },
  ];

  const isLoading = journalsLoading || (journalId && journalLoading);
  const isPending = createJournalMutation.isPending || updateJournalMutation.isPending || deleteJournalMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 pb-16 lg:pb-0">
        <MobileHeader />
        
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {journalId && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/journal")}
                  className="mr-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <h2 className="text-2xl font-bold font-heading">
                {journalId ? (isEditing ? "Edit Journal" : "Journal Entry") : "New Journal Entry"}
              </h2>
            </div>
            
            {journalId && !isEditing && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        Confirm Deletion
                      </DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this journal entry? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={deleteJournalMutation.isPending}
                      >
                        {deleteJournalMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            
            {!journalId && (
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => navigate("/journal")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Journals
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              {!journalId && journals?.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm">
                  <h3 className="text-xl font-medium mb-4">Welcome to your Journal</h3>
                  <p className="text-neutral-600 mb-6">
                    Start writing your first journal entry to track your thoughts and feelings.
                  </p>
                </div>
              ) : journalId && !isEditing ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{journal?.title}</CardTitle>
                      <div className="flex items-center">
                        <span className="text-xl mr-2">
                          {getMoodEmoji(journal?.mood || 3)}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {journal && format(new Date(journal.createdAt), "MMM d, yyyy • h:mm a")}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{journal?.content}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{journalId ? "Edit Journal Entry" : "New Journal Entry"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a title for your journal entry"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="content">Content</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPrompts(!showPrompts)}
                          className="text-sm"
                        >
                          {showPrompts ? (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Hide Prompts
                            </>
                          ) : (
                            <>
                              <Lightbulb className="h-4 w-4 mr-1" />
                              Writing Prompts
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {showPrompts && (
                        <div className="mb-3 border rounded-md p-4 bg-neutral-50">
                          <JournalPrompts onSelectPrompt={handlePromptSelect} />
                        </div>
                      )}
                      
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your thoughts here..."
                        className="min-h-[200px]"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="mood">How are you feeling?</Label>
                      <Select value={mood} onValueChange={setMood}>
                        <SelectTrigger id="mood" className="mt-1">
                          <SelectValue placeholder="Select your mood" />
                        </SelectTrigger>
                        <SelectContent>
                          {moodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center">
                                <span className="mr-2">{option.emoji}</span>
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="bg-primary hover:bg-primary/90 text-white"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {journalId ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        "Save Journal"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
              
              {!isEditing && !journalId && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Journal Entries</h3>
                  
                  <div className="mb-4">
                    <Button
                      onClick={() => {
                        setTitle("");
                        setContent("");
                        setMood("3");
                        setIsEditing(true);
                      }}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Entry
                    </Button>
                  </div>
                  
                  {journals?.length === 0 ? (
                    <Card className="bg-neutral-50">
                      <CardContent className="p-6 text-center">
                        <p className="text-neutral-600">No journal entries yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {journals?.map((journal) => (
                        <div
                          key={journal.id}
                          onClick={() => navigate(`/journal?id=${journal.id}`)}
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
              )}
            </>
          )}
        </div>
        
        <MobileNavigation />
      </div>
    </div>
  );
}
