import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { FullScreenLoader } from "./components/FullScreenLoader";

// Fallback screen for any unmatched route (including the Expo `--` callback on iOS).
// We immediately redirect back to the root; index.tsx will route based on auth state.
export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return <FullScreenLoader />;
}


