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

const journalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title can't exceed 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  mood: z.string().optional(),
});

type JournalFormValues = z.infer<typeof journalSchema>;

export function NewJournalForm() {
  const { toast } = useToast();
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: "",
      content: "",
      mood: "neutral",
    },
  });

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt);
    form.setValue("content", form.getValues("content") + (form.getValues("content") ? "\n\n" : "") + prompt);
  };

  const onSubmit = async (data: JournalFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/journals", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create journal entry");
      }
      
      // Invalidate journals query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      
      toast({
        title: "Journal Entry Created",
        description: "Your journal entry has been saved successfully.",
      });
      
      // Reset form
      form.reset();
      setSelectedPrompt("");
    } catch (error: any) {
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
    <div className="space-y-6">
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
                    <FormLabel>Current Mood</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your current mood" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="very_happy">Very Happy</SelectItem>
                        <SelectItem value="happy">Happy</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="sad">Sad</SelectItem>
                        <SelectItem value="very_sad">Very Sad</SelectItem>
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
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Journal Entry
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