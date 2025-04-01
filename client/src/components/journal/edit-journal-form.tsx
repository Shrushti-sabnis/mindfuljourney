import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, X } from "lucide-react";
import { JournalPrompts } from "./journal-prompts";
import { Journal } from "@shared/schema";
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
  mood: z.coerce.number().int().min(1).max(5), // Convert string to number for mood
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

interface EditJournalFormProps {
  journal: Journal;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EditJournalForm({ journal, onCancel, onSuccess }: EditJournalFormProps) {
  const { toast } = useToast();
  const [showPrompts, setShowPrompts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with react-hook-form
  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: journal.title,
      content: journal.content,
      mood: journal.mood,
    },
  });

  // Update form values when journal changes
  useEffect(() => {
    form.reset({
      title: journal.title,
      content: journal.content,
      mood: journal.mood,
    });
  }, [form, journal]);

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
      const response = await apiRequest("PUT", `/api/journals/${journal.id}`, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update journal entry");
      }
      
      // Invalidate journals query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journals", journal.id.toString()] });
      
      toast({
        title: "Journal Entry Updated",
        description: "Your journal entry has been updated successfully.",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error updating journal:", error);
      
      toast({
        title: "Error Updating Journal Entry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
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
            render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel>How are you feeling?</FormLabel>
                <Select
                  onValueChange={(val) => onChange(parseInt(val))}
                  value={value ? value.toString() : "3"}
                  {...rest}
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
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <FormLabel htmlFor="content">Content</FormLabel>
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
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
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
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}