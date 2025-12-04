import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import googlelogo from "@assets/googlelogo.png";
import facebooklogo from "@assets/facebooklogo.png";

const { width, height } = Dimensions.get("window");

// Ensure the OAuth browser session is completed on app load
WebBrowser.maybeCompleteAuthSession();

const LoginController = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  // If we already have a signed-in user (e.g. returning from OAuth), skip showing this screen.
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      console.log("isSignedIn", isSignedIn);
      router.replace("/tabs/profile");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    // Optionally show a splash / loader, or just null
    return null;
  }

  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({
    strategy: "oauth_facebook",
  });

  const handleRegister = () => {
    // Traditional email/password registration could go here if desired.
    console.log("Register pressed", { username, email, password });
  };

  const handleGoogleSignUp = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();
      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        router.replace("/(tabs)/profile");
      }
    } catch (err) {
      console.error("Google sign up failed", err);
    }
  }, [startGoogleOAuth]);

  const handleFacebookSignUp = React.useCallback(async () => {
    try {
      console.log("handleFacebookSignUp");
      const { createdSessionId, setActive } = await startFacebookOAuth();
      console.log("createdSessionId", createdSessionId);
      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        console.log("if createdSessionId", createdSessionId);
        router.replace("/(tabs)/profile");
      }
    } catch (err) {
      console.log("logggg");
      console.error("Facebook sign up failed", err);
    }
  }, [startFacebookOAuth]);

  // While auth state is loading or we're redirecting, render nothing to avoid flicker.
  // if (!isLoaded || isSignedIn) {
  //   return null;
  // }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LinearGradient
        // Button Linear Gradient
        colors={["#3E404D", "#1E1E2A", "#10101C", "#10101C"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          flex: 1,
          bottom: 0,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Create an{"\n"}account</Text>
            </View>

            {/* Social Sign Up Section */}
            <View style={styles.socialSection}>
              <View style={styles.textContainer}>
                <Text style={styles.socialText}>Sign up with</Text>
              </View>

              <View style={styles.socialButtonsContainer}>
                {/* Google Button */}
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGoogleSignUp}
                  activeOpacity={0.7}
                >
                  <Image
                    // source={require("../../../assets/googlelogo.png")}
                    source={googlelogo}
                    style={styles.socialIcon}
                  />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                {/* Facebook Button */}
                <TouchableOpacity
                  style={[styles.socialButton]}
                  onPress={handleFacebookSignUp}
                  activeOpacity={0.7}
                >
                  <Image
                    // source={require("../../../assets/facebooklogo.png")}
                    source={facebooklogo}
                    style={[styles.socialIcon]}
                  />
                  <Text style={[styles.socialButtonText]}>Facebook</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Username Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="username"
                  placeholderTextColor="#9BA1A6"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@mail.com"
                  placeholderTextColor="#9BA1A6"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="XXXXXXXX"
                    placeholderTextColor="#9BA1A6"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={18}
                      color="#9BA1A6"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Register Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                activeOpacity={0.8}
              >
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LoginController;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#151718",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    // flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 30,
    justifyContent: "center",
    marginTop: 70,
    // marginTop: Platform.OS === "ios" ? 0 : 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    marginTop: Platform.OS === "ios" ? 0 : 10,
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 40,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  socialSection: {
    marginBottom: 40,
  },
  socialText: {
    fontSize: 14,
    color: "#9BA1A6",
    marginBottom: 16,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "#272833",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  socialIcon: {
    width: 20,
    height: 20,
    // fontSize: 14,
    // fontWeight: "bold",
    // color: "#4285F4",
  },
  facebookIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1877F2",
    justifyContent: "center",
    alignItems: "center",
  },
  socialButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  inputLabel: {
    top: 14,
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 8,
    fontWeight: "500",
    width: 90, // fixed label width so all TextInputs start in the same column
  },
  input: {
    flex: 0.9,
    fontSize: 15,
    color: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    paddingBottom: 5,
    // paddingVertical: 12,
    paddingHorizontal: 0,
  },
  passwordContainer: {
    flex: 0.9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  passwordInput: {
    // flex: 0.9,
    fontSize: 15,
    color: "#FFFFFF",
    paddingBottom: 5,
    // paddingVertical: 12,
    paddingHorizontal: 0,
  },
  eyeIcon: {
    // flex: 1,
    alignSelf: "flex-end",
    // padding: 4,
    // marginLeft: 8,
  },
  registerButton: {
    width: "60%",
    backgroundColor: "#1877F2",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    ...Platform.select({
      ios: {
        shadowColor: "#1877F2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
    flex: 1,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    alignItems: "center",
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialIconDisabled: {
    opacity: 0.5,
  },
  socialButtonTextDisabled: {
    opacity: 0.5,
  },
});
