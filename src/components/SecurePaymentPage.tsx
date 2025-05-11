import React, { useState } from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface SecurePaymentPageProps {
  amount: number;
  onClose: () => void;
  onPaymentComplete: () => void;
  bookingReference: string;
  type: 'tour' | 'adventure';
  tourId?: string;
  adventureId?: string;
}

export default function SecurePaymentPage({
  amount,
  onClose,
  onPaymentComplete,
  bookingReference,
  type,
  tourId,
  adventureId
}: SecurePaymentPageProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStripePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      // Create Stripe checkout session
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount,
          reference: bookingReference,
          type,
          tourId,
          adventureId,
          successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&reference=${bookingReference}&type=${type}`,
          cancelUrl: `${window.location.origin}/payment-cancelled`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId
      });

      if (redirectError) {
        throw redirectError;
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : language === 'it' 
            ? 'Si è verificato un errore durante il pagamento. Riprova.'
            : 'An error occurred during payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
              {language === 'it' ? 'Indietro' : 'Back'}
            </button>
            <h2 className="text-xl font-semibold">
              {language === 'it' ? 'Pagamento Sicuro' : 'Secure Payment'}
            </h2>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {language === 'it' ? 'Totale da pagare' : 'Total to pay'}
              </span>
              <span className="text-2xl font-bold">€{amount.toFixed(2)}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {language === 'it' ? 'Riferimento:' : 'Reference:'} {bookingReference}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStripePayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#635BFF] text-white py-3 rounded-lg font-semibold hover:bg-[#4B44E9] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            {loading
              ? language === 'it' ? 'Elaborazione...' : 'Processing...'
              : language === 'it' ? 'Paga con Carta' : 'Pay with Card'}
          </button>
        </div>
      </div>
    </div>
  );
}