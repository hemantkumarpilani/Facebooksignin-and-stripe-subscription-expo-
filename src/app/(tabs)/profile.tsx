import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth as firebaseAuth } from "../../config/firebase";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setFirebaseUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleLogoutAndDelete = async () => {
    Alert.alert(
      "Logout account",
      "This will sign you out. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              if (user) {
                // Clerk flow
                await signOut();
              } else if (firebaseUser) {
                await firebaseSignOut(firebaseAuth);
              }
              router.replace("/(auth)/login");
            } catch (err) {
              console.error("Logout error", err);
              Alert.alert(
                "Error",
                "We couldn't log you out. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    firebaseUser?.displayName ||
    "User";
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    firebaseUser?.email ||
    "Logged in user";
  const avatarUrl = user?.imageUrl || firebaseUser?.photoURL || undefined;
  const userId = user?.id || firebaseUser?.uid || "";
  const statusText = user
    ? "Signed in (Clerk)"
    : firebaseUser
    ? "Signed in (Firebase)"
    : "Signed out";

  return (
    <LinearGradient
      colors={["#3E404D", "#1E1E2A", "#10101C", "#10101C"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
          )}

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>User ID</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {userId}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutAndDelete}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    backgroundColor: "rgba(15, 15, 25, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    backgroundColor: "#2B2D3A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: "#C1C6CC",
    marginBottom: 18,
    textAlign: "center",
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 16,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: "#8E94A3",
  },
  rowValue: {
    fontSize: 14,
    color: "#FFFFFF",
    maxWidth: "55%",
    textAlign: "right",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(76, 175, 80, 0.18)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: {
    color: "#A5D6A7",
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 24,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
