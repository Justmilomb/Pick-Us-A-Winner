import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface CheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // fallback, won't be used
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMessage("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full min-w-0">
      {/* Accordion layout shows all payment options (card, Apple Pay, Google Pay) on mobile. Apple Pay requires HTTPS + Stripe domain verification. */}
      <div className="w-full min-w-0 overflow-visible min-w-[280px]">
        <PaymentElement
          options={{
            layout: "accordion",
            paymentMethodOrder: ["card", "apple_pay", "google_pay", "link"],
          }}
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-300 text-red-800 text-xs sm:text-sm font-bold uppercase">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full neo-btn-primary bg-[#E1306C] hover:bg-[#C13584] text-white text-base sm:text-lg md:text-xl py-5 sm:py-6"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay £5.00"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        className="w-full mt-2 text-base sm:text-lg font-bold uppercase"
        disabled={isProcessing}
      >
        Back to URL Input
      </Button>
    </form>
  );
}
