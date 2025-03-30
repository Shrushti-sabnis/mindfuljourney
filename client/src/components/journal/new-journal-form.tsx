import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { JournalPrompts } from "./journal-prompts";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the schema for the journal form validation
const journalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title can't exceed 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  mood: z.string().transform(val => parseInt(val)), // Convert string to number for mood
});

type JournalFormValues = z.infer<typeof journalSchema>;

// Mood options for the select field
const moodOptions = [
  { value: "5", label: "Great", emoji: "😊" },
  { value: "4", label: "Good", emoji: "😌" },
  { value: "3", label: "Okay", emoji: "😐" },
  { value: "2", label: "Low", emoji: "😔" },
  { value: "1", label: "Rough", emoji: "😟" },
];

export function NewJournalForm() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with react-hook-form
  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: "",
      content: "",
      mood: "3", // Default to "Okay"
    },
  });

  // Handle selecting a journal prompt
  const handlePromptSelect = (prompt: string) => {
    // If content is empty, just set it to the prompt
    if (!form.getValues("content")) {
      form.setValue("content", prompt);
    } else {
      // Otherwise, append the prompt to the existing content with a line break
      form.setValue(
        "content", 
        form.getValues("content") + "\n\n" + prompt
      );
    }

    // Focus the textarea after adding the prompt
    setTimeout(() => {
      const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        // Place cursor at the end
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
      }
    }, 100);
  };

  // Submit handler for the form
  const onSubmit = async (data: JournalFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/journals", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create journal entry");
      }

      const journal = await response.json();
      
      // Invalidate journals query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      
      toast({
        title: "Journal Entry Created",
        description: "Your journal entry has been saved successfully.",
      });
      
      // Navigate to the journal details page
      navigate(`/journal?id=${journal.id}`);
    } catch (error: any) {
      console.error("Error creating journal:", error);
      
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
        title: "Error Creating Journal Entry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <input
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Give your journal entry a title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How are you feeling?</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your mood" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Journal Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your thoughts here..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Save Journal Entry"
                )}
              </Button>
            </form>
          </Form>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Journal Prompts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Need inspiration? Select a prompt to help guide your journal entry.
          </p>
          <JournalPrompts onSelectPrompt={handlePromptSelect} />
        </div>
      </div>
    </div>
  );
}