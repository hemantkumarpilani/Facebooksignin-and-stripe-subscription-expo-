import React from "react";
import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StripeProvider } from "@stripe/stripe-react-native";

// Root layout for expo-router. Wraps all routes with ClerkProvider and StripeProvider.
export default function RootLayout() {
  // The publishable key should be configured in your Expo env:
  // EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
  const publishableKey =
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "<YOUR_PUBLISHABLE_KEY>";

  return (
    <StripeProvider publishableKey={publishableKey}>
      <ClerkProvider tokenCache={tokenCache}>
        <Slot />
      </ClerkProvider>
    </StripeProvider>
  );
}
