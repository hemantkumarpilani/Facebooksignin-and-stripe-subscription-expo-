import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

// Gatekeeper screen: decides where to send the user based on auth state
// In backend -> .env file
// STRIPE_SECRET_KEY =
//   sk_test122321312232;

// In root -> .env file
// EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY =
//   pk_test_12345;
// EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY =
//   pk_test_23424345;

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  console.log("Index Index", isSignedIn);

  if (!isLoaded) {
    return null; // You could render a splash/loading screen here
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return <Redirect href="/(auth)/login" />;
}
