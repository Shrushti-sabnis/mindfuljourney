import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileNavigation } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 
  "pk_test_TYooMQauvdEDq54NiTphI7jx" // Fallback for development
);

// Checkout form component
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}?payment_success=true`,
      },
    });

    setIsProcessing(false);

    if (error) {
      setErrorMessage(error.message || "An unknown error occurred");
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <div className="text-sm text-destructive flex items-center mt-2">
          <XCircle className="h-4 w-4 mr-1" />
          {errorMessage}
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full bg-accent hover:bg-accent/90 text-white" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe Now"
        )}
      </Button>
    </form>
  );
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  // Create subscription mutation
  const subscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-subscription");
      return await response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize subscription on component mount
  useEffect(() => {
    if (!user?.isPremium && !clientSecret) {
      subscriptionMutation.mutate();
    }
  }, [user, clientSecret]);

  // Check for successful payment from URL params
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentSuccess = query.get("payment_success");
    
    if (paymentSuccess === "true") {
      toast({
        title: "Payment successful!",
        description: "Thank you for subscribing to MIND Premium.",
      });
      
      // Clear the URL parameter without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const premiumFeatures = [
    "Advanced mood analytics and insights",
    "Deep reflection journal prompts",
    "Premium guided meditation sessions",
    "Personalized mindfulness recommendations",
    "Unlimited journal entries",
    "Ad-free experience",
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100">
      <Sidebar />
      
      <div className="flex-1 pb-16 lg:pb-0">
        <MobileHeader />
        
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold font-heading mb-6">Premium Subscription</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Upgrade Your Mental Wellness Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <p className="text-neutral-600 mb-4">
                      Unlock premium features to enhance your mental wellbeing experience with MIND.
                    </p>
                    
                    <div className="bg-accent/10 p-4 rounded-lg mb-6">
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-accent">$9.99</span>
                        <span className="text-neutral-500 ml-2">/ month</span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        Cancel anytime. No long-term commitment required.
                      </p>
                    </div>
                    
                    <h3 className="font-medium mb-3">Premium Features Include:</h3>
                    <ul className="space-y-2">
                      {premiumFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 text-accent mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              {user?.isPremium ? (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>You're already a Premium Member!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-accent" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Thank You for Your Support</h3>
                      <p className="text-neutral-600 mb-4">
                        You have full access to all premium features. Enjoy your enhanced mental wellness journey!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : subscriptionMutation.isPending || !clientSecret ? (
                <Card>
                  <CardContent className="p-12 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p>Preparing subscription details...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Complete Your Subscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm />
                    </Elements>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start border-t pt-6">
                    <p className="text-sm text-neutral-500 mb-2">
                      💳 Your payment is processed securely through Stripe
                    </p>
                    <p className="text-sm text-neutral-500">
                      🔒 We do not store your payment details
                    </p>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">How does billing work?</h4>
                <p className="text-sm text-neutral-600">
                  You'll be charged monthly until you cancel. Your subscription renews automatically.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Can I cancel anytime?</h4>
                <p className="text-sm text-neutral-600">
                  Yes, you can cancel your subscription at any time. You'll continue to have premium access until the end of your billing period.
                </p>
              </div>
              <div>
                <h4 className="font-medium">What payment methods are accepted?</h4>
                <p className="text-sm text-neutral-600">
                  We accept all major credit cards including Visa, Mastercard, American Express, and Discover.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <MobileNavigation />
      </div>
    </div>
  );
}
