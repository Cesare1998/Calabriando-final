import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  onSuccess: (orderId: string) => void;
  onError: (error: Error) => void;
}

export default function PayPalButton({ 
  amount, 
  currency = 'EUR',
  onSuccess,
  onError 
}: PayPalButtonProps) {
  return (
    <PayPalScriptProvider options={{
      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
      currency: currency,
      intent: "capture"
    }}>
      <PayPalButtons
        style={{ layout: "horizontal" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: currency,
                  value: amount.toFixed(2)
                }
              }
            ]
          });
        }}
        onApprove={async (data, actions) => {
          try {
            const order = await actions.order?.capture();
            if (!order) {
              throw new Error('Failed to capture order');
            }
            onSuccess(order.id);
          } catch (err) {
            console.error('PayPal capture error:', err);
            onError(err instanceof Error ? err : new Error('Payment capture failed'));
          }
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          onError(err instanceof Error ? err : new Error('PayPal payment failed'));
        }}
      />
    </PayPalScriptProvider>
  );
}