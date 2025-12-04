// app/components/FullScreenLoader.tsx
import React from "react";
import { ActivityIndicator, StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function FullScreenLoader() {
  return (
    <LinearGradient
      colors={["#3E404D", "#1E1E2A", "#10101C", "#10101C"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.text}>Signing you in…</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },
});
