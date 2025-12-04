import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStripe } from "@stripe/stripe-react-native";
import { useUser } from "@clerk/clerk-expo";

type Plan = {
  id: string;
  name: string;
  price: string;
  stripePriceId: string;
  description: string;
};

// Example plans – wire these to your real Stripe price IDs on the backend.
const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$9.99 / month",
    stripePriceId: "price_1SaEZ6CkqxJR2InQOplXVoR5",
    description: "Perfect for getting started with the basics.",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19.99 / month",
    stripePriceId: "price_1SaEaECkqxJR2InQjt1boVVc",
    description: "For power users who need more features.",
  },
  {
    id: "business",
    name: "Business",
    price: "$39.99 / month",
    stripePriceId: "price_1SaEawCkqxJR2InQp69Q7rrI",
    description: "Teams and businesses that need premium support.",
  },
];

export default function StripeScreen() {
  const { user } = useUser();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // IMPORTANT: base URL differs between Android emulator and iOS simulator.
  // - Android emulator: 10.0.2.2 points to host machine
  // - iOS simulator: localhost points to host machine
  const API_BASE_URL =
    Platform.OS === "android"
      ? "http://10.0.2.2:4242"
      : "http://localhost:4242";

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId)!;

  // Load existing subscription on mount.
  useEffect(() => {
    const load = async () => {
      try {
        const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) return;

        const res = await fetch(
          `${API_BASE_URL}/stripe/subscription?email=${encodeURIComponent(
            email
          )}`
        );
        const json = await res.json();
        console.log("json json", json);

        if (json.subscription) {
          setSubscriptionId(json.subscription.subscriptionId);
          const plan = PLANS.find(
            (p) => p.stripePriceId === json.subscription.priceId
          );
          if (plan) {
            setCurrentPlanId(plan.id);
            // Also select the current plan in the UI so the card is highlighted
            // and the primary button shows "You are on {plan}".
            setSelectedPlanId(plan.id);
          } else {
            setCurrentPlanId(null);
            setSubscriptionId(null);
          }
        } else {
          // No active subscription on Stripe – clear local state.
          setCurrentPlanId(null);
          setSubscriptionId(null);
        }
      } catch (err) {
        console.log("ndkan,smdasd", err);
        console.error("Load subscription error", err);
      }
    };
    load();
  }, [user]);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) {
        Alert.alert("Error", "No email found for this user.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/stripe/create-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPlan.stripePriceId,
          email,
        }),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }

      const initRes = await initPaymentSheet({
        customerId: json.customerId,
        customerEphemeralKeySecret: json.ephemeralKeySecret,
        paymentIntentClientSecret: json.paymentIntentClientSecret,
        merchantDisplayName: "Social Signin App",
      });
      if (initRes.error) {
        throw new Error(initRes.error.message);
      }

      const presentRes = await presentPaymentSheet();
      if (presentRes.error) {
        throw new Error(presentRes.error.message);
      }

      setCurrentPlanId(selectedPlan.id);
      setSubscriptionId(json.subscriptionId);
      Alert.alert(
        "Subscription active",
        `You're now on the ${selectedPlan.name} plan.`
      );
    } catch (err) {
      console.error("Subscribe error", err);
      Alert.alert(
        "Error",
        "Unable to start your subscription. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentPlanId) return;
    try {
      setIsLoading(true);
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email || !subscriptionId) {
        Alert.alert("Error", "No subscription found to update.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/stripe/update-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPriceId: selectedPlan.stripePriceId,
        }),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }

      // On Android, open PaymentSheet so the user confirms any prorated charges.
      // iOS is currently hitting a Stripe SDK issue here, so we skip the sheet
      // and rely on Stripe to auto-charge the saved payment method.
      if (Platform.OS === "android") {
        const initRes = await initPaymentSheet({
          customerId: json.customerId,
          customerEphemeralKeySecret: json.ephemeralKeySecret,
          paymentIntentClientSecret: json.paymentIntentClientSecret,
          merchantDisplayName: "Social Signin App",
        });
        if (initRes.error) {
          throw new Error(initRes.error.message);
        }

        const presentRes = await presentPaymentSheet();
        if (presentRes.error) {
          const msg = presentRes.error.message ?? "";
          // If Stripe says the PaymentIntent is already in 'succeeded' status,
          // treat it as a successful update (no additional payment needed).
          if (!msg.includes("status 'succeeded'")) {
            throw new Error(msg);
          }
        }
      }

      setCurrentPlanId(selectedPlan.id);
      setSubscriptionId(json.subscriptionId);
      Alert.alert(
        "Updated",
        `Your subscription was updated to ${selectedPlan.name}.`
      );
    } catch (err) {
      console.error("Update error", err);
      Alert.alert(
        "Error",
        "Unable to update your subscription. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentPlanId) return;
    try {
      setIsLoading(true);
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email || !subscriptionId) {
        Alert.alert("Error", "No subscription found to cancel.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/stripe/cancel-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }

      setCurrentPlanId(null);
      setSubscriptionId(null);
      Alert.alert("Cancelled", "Your subscription has been cancelled.");
    } catch (err) {
      console.error("Cancel error", err);
      Alert.alert(
        "Error",
        "Unable to cancel your subscription. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderPrimaryButton = () => {
    if (!currentPlanId) {
      return (
        <PrimaryButton
          label={`Start ${selectedPlan.name} subscription`}
          onPress={handleSubscribe}
          disabled={isLoading}
        />
      );
    }
    if (currentPlanId !== selectedPlanId) {
      return (
        <PrimaryButton
          label={`Switch to ${selectedPlan.name}`}
          onPress={handleUpdate}
          disabled={isLoading}
        />
      );
    }
    return (
      <PrimaryButton
        label={`You are on ${selectedPlan.name}`}
        onPress={() => {}}
        disabled
      />
    );
  };

  return (
    <LinearGradient
      colors={["#3E404D", "#1E1E2A", "#10101C", "#10101C"]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Subscriptions</Text>
        <Text style={styles.subheading}>
          Choose the plan that fits you best. You can upgrade, downgrade, or
          cancel at any time.
        </Text>

        <View style={styles.planRow}>
          {PLANS.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const isCurrent = plan.id === currentPlanId;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  isCurrent && styles.planCardCurrent,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                {isCurrent && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Current</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          {renderPrimaryButton()}

          {currentPlanId && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleCancel}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>
                Cancel subscription
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.helperText}>
            Payments are securely processed by Stripe. This is a demo UI – wire
            the buttons to your backend Stripe endpoints to make it live.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

const PrimaryButton = ({ label, onPress, disabled }: PrimaryButtonProps) => (
  <TouchableOpacity
    style={[styles.primaryButton, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <Text style={styles.primaryButtonText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    color: "#C1C6CC",
    textAlign: "center",
    marginBottom: 24,
  },
  planRow: {
    flexDirection: "column",
    gap: 16,
    marginBottom: 28,
  },
  planCard: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: "rgba(21, 23, 24, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  planCardSelected: {
    borderColor: "#4E8AFF",
    shadowColor: "#4E8AFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  planCardCurrent: {
    borderColor: "#4CAF50",
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4E8AFF",
    marginBottom: 6,
  },
  planDescription: {
    fontSize: 14,
    color: "#A0A7AF",
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(76, 175, 80, 0.18)",
  },
  badgeText: {
    color: "#A5D6A7",
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: "#1877F2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "#8E949C",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
