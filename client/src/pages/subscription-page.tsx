import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckIcon, LockOpen, ShieldCheck, BarChart, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/premium/activate");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to activate premium");
      }
      
      // Invalidate the user query to get the updated user data with isPremium=true
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Premium activated!",
        description: "You now have access to all premium features",
        variant: "default",
      });
      
      // Navigate to the mindfulness page to explore premium content
      setLocation("/mindfulness");
    } catch (error: any) {
      toast({
        title: "Error activating premium",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (user?.isPremium) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-card rounded-lg shadow-lg text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full mb-4">
          <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold mb-4">You're a Premium Member!</h1>
        <p className="text-muted-foreground mb-6">
          You already have an active premium subscription. Enjoy all the advanced features!
        </p>
        <Button onClick={() => setLocation("/mindfulness")} className="w-full">
          Access Premium Content
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto mt-16 p-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Upgrade to Premium</h1>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Unlock advanced features and premium content to enhance your mental wellness journey.
            </p>
          </div>
          
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-xl font-semibold mb-4">Premium Benefits</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <LockOpen className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Access to all premium mindfulness sessions</span>
              </li>
              <li className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Exclusive deep reflection journal prompts</span>
              </li>
              <li className="flex items-start">
                <BarChart className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Advanced mood analytics and insights</span>
              </li>
              <li className="flex items-start">
                <Sparkles className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Ad-free experience across the platform</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Activate Premium</h2>
          <p className="mb-6 text-muted-foreground">
            Since this is a demo application, you can activate premium features instantly without payment.
          </p>
          <Button 
            onClick={handleSubscribe} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Activate Premium
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            In a production app, this would connect to a real payment processor.
          </p>
        </div>
      </div>
    </div>
  );
}