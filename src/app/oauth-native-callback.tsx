import { View } from "react-native";
import { FullScreenLoader } from "./components/FullScreenLoader";

export default function OAuthNativeCallback() {
  // Clerk handles this; render nothing
  return <FullScreenLoader />;
}
