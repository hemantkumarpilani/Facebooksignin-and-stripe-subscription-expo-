import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

// Gatekeeper screen: decides where to send the user based on auth state
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
