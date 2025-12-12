import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import googlelogo from "@assets/googlelogo.png";
import facebooklogo from "@assets/facebooklogo.png";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import {
  LoginManager,
  AccessToken,
  LoginButton,
  Settings,
  Profile,
} from "react-native-fbsdk-next";
import {
  signInWithCredential,
  FacebookAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  linkWithCredential,
  UserCredential,
  fetchSignInMethodsForEmail,
  AuthError,
} from "firebase/auth";
import { auth } from "../../../../config/firebase";

const { width, height } = Dimensions.get("window");

// Ensure the OAuth browser session is completed on app load
WebBrowser.maybeCompleteAuthSession();

const LoginController = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingCred, setPendingCred] = useState<
    | ReturnType<typeof FacebookAuthProvider.credential>
    | ReturnType<typeof GoogleAuthProvider.credential>
    | null
  >(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  // Check Firebase authentication state on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Firebase user already signed in, redirecting to home");
        router.replace("/(tabs)/profile");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // If we already have a signed-in user (e.g. returning from OAuth), skip showing this screen.
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      console.log("isSignedIn", isSignedIn);
      router.replace("/(tabs)/profile");
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

  useEffect(() => {
    const requestTracking = async () => {
      const { status } = await requestTrackingPermissionsAsync();

      Settings.initializeSDK();

      if (status === "granted") {
        await Settings.setAdvertiserTrackingEnabled(true);
      }
    };

    requestTracking();
  }, []);

  // Configure Google Sign-in for Firebase
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        // You need to get the Web Client ID from Firebase Console:
        // Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration
        // Or from Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs (Web application)
        await GoogleSignin.configure({
          webClientId:
            "86476201066-vc72p01s197b77huemmqesmm896bqn3c.apps.googleusercontent.com", // Replace with your actual Web Client ID
          offlineAccess: true,
          forceCodeForRefreshToken: true,
        });
      } catch (error) {
        console.error("Google Sign-in configuration error:", error);
      }
    };

    configureGoogleSignIn();
  }, []);

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

  // const loginWithGoogle = useCallback(async () => {
  //   try {
  //     // Check if Google Play Services are available (Android only)
  //     if (Platform.OS === "android") {
  //       await GoogleSignin.hasPlayServices();
  //     }

  //     // Sign in with Google
  //     const response = await GoogleSignin.signIn();

  //     if (isSuccessResponse(response)) {
  //       console.log("Google sign-in successful:", response.data);

  //       // Get the ID token from Google Sign-in
  //       const idToken = response.data?.idToken;

  //       if (!idToken) {
  //         Alert.alert("Error", "Failed to get ID token from Google Sign-in");
  //         return;
  //       }

  //       // Create a Firebase credential using the Google ID token
  //       const googleCredential = GoogleAuthProvider.credential(idToken);

  //       // Sign in to Firebase with the Google credential
  //       const userCredential = await signInWithCredential(
  //         auth,
  //         googleCredential
  //       );

  //       console.log("Firebase user signed in:", userCredential.user);
  //       console.log("User email:", userCredential.user.email);
  //       console.log("User display name:", userCredential.user.displayName);

  //       // Navigate to profile screen after successful authentication
  //       router.replace("/(tabs)/profile");
  //     } else {
  //       // Sign in was cancelled by user
  //       console.log("Google sign-in cancelled by user");
  //     }
  //   } catch (error: any) {
  //     console.log(JSON.stringify(error, null, 2));
  //     console.error("Google sign-in error:", error);

  //     if (isErrorWithCode(error)) {
  //       switch (error.code) {
  //         case statusCodes.IN_PROGRESS:
  //           // Operation (e.g. sign in) already in progress
  //           Alert.alert("Info", "Google sign-in is already in progress");
  //           break;
  //         case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
  //           // Android only, play services not available or outdated
  //           Alert.alert(
  //             "Error",
  //             "Google Play Services not available. Please update Google Play Services."
  //           );
  //           break;
  //         case statusCodes.SIGN_IN_CANCELLED:
  //           console.log("Google sign-in cancelled by user");
  //           break;
  //         default:
  //           Alert.alert(
  //             "Error",
  //             error.message ||
  //               "Failed to sign in with Google. Please try again."
  //           );
  //       }
  //     } else {
  //       // An error that's not related to Google sign in occurred
  //       Alert.alert(
  //         "Error",
  //         error.message || "An unexpected error occurred. Please try again."
  //       );
  //     }
  //   }
  // }, [router]);

  const handleAccountExistsError = async (
    error: any,
    newCredential:
      | ReturnType<typeof GoogleAuthProvider.credential>
      | ReturnType<typeof FacebookAuthProvider.credential>
  ) => {
    const _error = error as AuthError & {
      customData?: { email?: string };
      email?: string;
    };

    if (_error.code !== "auth/account-exists-with-different-credential") {
      throw error;
    }

    const emailFromError = _error.customData?.email || (_error as any).email;
    if (!emailFromError) {
      Alert.alert(
        "Login error",
        "Account exists with a different provider, but email is missing. Please use the original provider."
      );
      return;
    }

    const methods = await fetchSignInMethodsForEmail(auth, emailFromError);
    console.log("Existing sign-in methods for email:", emailFromError, methods);

    setPendingCred(newCredential);
    setPendingEmail(emailFromError);

    if (methods.includes("google.com")) {
      Alert.alert(
        "Account already exists",
        "This email is already linked to Google. Please sign in with Google, then we will link the new provider."
      );
    } else if (methods.includes("facebook.com")) {
      Alert.alert(
        "Account already exists",
        "This email is already linked to Facebook. Please sign in with Facebook, then we will link the new provider."
      );
    } else {
      Alert.alert(
        "Account already exists",
        "This email is already linked to another sign-in method. Please use that method first."
      );
    }
  };

  const tryLinkPendingCredential = async () => {
    if (!pendingCred || !auth.currentUser) return;

    try {
      const result: UserCredential = await linkWithCredential(
        auth.currentUser,
        pendingCred
      );
      console.log("Linked additional provider to existing account:", {
        user: result.user.uid,
        providers: result.user.providerData.map((p) => p.providerId),
      });
      setPendingCred(null);
      setPendingEmail(null);
    } catch (err) {
      console.error("Failed to link pending credential:", err);
      Alert.alert(
        "Linking error",
        "We could not link the additional provider. You can still continue with the provider you used to sign in."
      );
    }
  };

  const loginWithGoogle = useCallback(async () => {
    try {
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices();
      }

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        console.log("Google sign-in cancelled by user");
        return;
      }

      console.log("Google sign-in successful:", response.data);

      const idToken = response.data?.idToken;

      if (!idToken) {
        Alert.alert("Error", "Failed to get ID token from Google Sign-in");
        return;
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);

      try {
        const userCredential = await signInWithCredential(
          auth,
          googleCredential
        );
        console.log("Firebase user signed in (Google):", userCredential.user);

        // If we had a pending credential (e.g. Facebook), link it now
        await tryLinkPendingCredential();

        router.replace("/(tabs)/profile");
      } catch (err: any) {
        if (err?.code === "auth/account-exists-with-different-credential") {
          await handleAccountExistsError(err, googleCredential);
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      console.error("Google sign-in error:", error);

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Alert.alert("Info", "Google sign-in is already in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              "Error",
              "Google Play Services not available. Please update Google Play Services."
            );
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("Google sign-in cancelled by user");
            break;
          default:
            Alert.alert(
              "Error",
              error.message ||
                "Failed to sign in with Google. Please try again."
            );
        }
      } else {
        Alert.alert(
          "Error",
          error?.message || "An unexpected error occurred. Please try again."
        );
      }
    }
  }, [router, pendingCred, pendingEmail]);

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

  const loginWithFacebook = async () => {
    try {
      console.log("loginWithFacebook");
      const result = await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);

      if (result.isCancelled) {
        console.log("==> Login cancelled");
        return;
      }

      console.log("Facebook login result:", result);

      // Get the Facebook access token
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        Alert.alert("Error", "Failed to get Facebook access token");
        return;
      }

      console.log("Facebook access token:", data.accessToken);

      // Create a Firebase credential using the Facebook access token
      const facebookCredential = FacebookAuthProvider.credential(
        data.accessToken
      );

      // Sign in to Firebase with the Facebook credential
      const userCredential = await signInWithCredential(
        auth,
        facebookCredential
      );
      console.log("Firebase user signed in:", userCredential.user);

      // Get user profile data from Facebook
      const currentProfile = await Profile.getCurrentProfile();
      console.log("Facebook profile:", currentProfile);

      // Navigate to home screen after successful login
      router.replace("/(tabs)/profile");
    } catch (error: any) {
      console.error("Facebook login failed:", error);
      Alert.alert(
        "Login Error",
        error.message || "Failed to sign in with Facebook. Please try again."
      );
    }
  };

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
                  // onPress={handleGoogleSignUp}
                  onPress={loginWithGoogle}
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
                  // onPress={handleFacebookSignUp}
                  onPress={loginWithFacebook}
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
