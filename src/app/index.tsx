import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../config/firebase";

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
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firebaseAuthLoaded, setFirebaseAuthLoaded] = useState(false);

  // Check Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "Firebase auth state changed:",
        user ? "signed in" : "signed out"
      );
      setFirebaseUser(user);
      setFirebaseAuthLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  console.log(
    "Index - Clerk isSignedIn:",
    isSignedIn,
    "Firebase user:",
    firebaseUser
  );

  // Wait for both Clerk and Firebase auth to load
  if (!isLoaded || !firebaseAuthLoaded) {
    return null; // You could render a splash/loading screen here
  }

  // If user is signed in with either Clerk or Firebase, redirect to home
  if (isSignedIn || firebaseUser) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return <Redirect href="/(auth)/login" />;
}
