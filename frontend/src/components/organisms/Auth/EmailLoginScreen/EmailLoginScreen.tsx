import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
  Animated,
  Vibration,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import LottieView from "lottie-react-native";
import { styles } from "./styles";
import { Assets } from "../../../../theme";
import { GoogleLogo } from "../../../atoms/GoogleLogo";
import { TypewriterText } from "../../../atoms/TypewriterText";
import { ChatBubble } from "../../../atoms/ChatBubble";
import { Button } from "../../../atoms/Button/Button";
import { GradientInputBorder } from "../../../atoms/GradientInputBorder";
import {
  useSendEmailOtp,
  useVerifyEmailOtpRaw,
  useGoogleAuthRaw,
} from "../../../../api/hooks/useAuth";
import { useAuthStore } from "../../../../store/authStore";
import { secureStorage } from "../../../../utils/storage";
import { config } from "../../../../config";
import { useGoogleSignIn } from "../../../../hooks/useGoogleSignIn";

interface EmailLoginScreenProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  onGoToRegister?: () => void;
}

const maskEmail = (value: string): string => {
  const emailValue = value?.trim().toLowerCase();
  if (!emailValue || !emailValue.includes("@")) return "invalid-email";
  const [name, domain] = emailValue.split("@");
  if (!name || !domain) return "invalid-email";
  if (name.length <= 2) return `${name[0] || "*"}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

type LoginStep = "EMAIL" | "OTP";

export const EmailLoginScreen: React.FC<EmailLoginScreenProps> = ({
  onBack,
  onLoginSuccess,
  onGoToRegister,
}) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<LoginStep>("EMAIL");

  // State for account not found popup
  const [showAccountNotFoundModal, setShowAccountNotFoundModal] =
    useState(false);

  // State for email input
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // State for OTP input
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpSuccess, setIsOtpSuccess] = useState(false);
  const [activeOtpIndex, setActiveOtpIndex] = useState<number | null>(null);
  const [showOtpSentToast, setShowOtpSentToast] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Auto-hide OTP sent toast after 1.5 seconds
  useEffect(() => {
    if (showOtpSentToast) {
      const timer = setTimeout(() => {
        setShowOtpSentToast(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [showOtpSentToast]);

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Countdown for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (step === "OTP" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer > 0]);

  // Auto-focus OTP input when step changes to OTP
  useEffect(() => {
    if (step === "OTP") {
      const focusInput = () => {
        if (otpRefs.current && otpRefs.current[0]) {
          otpRefs.current[0].focus();
        }
      };

      // Try multiple times to ensure it catches the right timing
      // especially after unmounting previous inputs and keyboard animations
      const t1 = setTimeout(focusInput, 100);
      const t2 = setTimeout(focusInput, 400);
      const t3 = setTimeout(focusInput, 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [step]);

  // API hooks
  const sendEmailOtpMutation = useSendEmailOtp();
  const verifyEmailOtpMutation = useVerifyEmailOtpRaw();
  const googleAuthMutation = useGoogleAuthRaw();

  // Google Sign-In hook (native)
  const {
    signIn: googleNativeSignIn,
    isLoading: isGoogleLoading,
    isExpoGo,
  } = useGoogleSignIn();

  const isLoading =
    sendEmailOtpMutation.isPending ||
    verifyEmailOtpMutation.isPending ||
    googleAuthMutation.isPending ||
    isGoogleLoading;

  // Step-specific bubble messages
  const getBubbleMessages = () => {
    switch (step) {
      case "EMAIL":
        return {
          title: t("emailLoginScreen.welcomeTitle"),
          subtitle: t("emailLoginScreen.welcomeSubtitle"),
        };
      case "OTP":
        return {
          title: t("emailLoginScreen.verifyTitle"),
          subtitle: t("emailLoginScreen.verifySubtitle"),
        };
    }
  };
  const bubbleMessages = getBubbleMessages();

  const handleSendEmailOtp = () => {
    setEmailError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError(t("validation.emailInvalid"));
      return;
    }

    if (email.trim().length > 0) {
      console.log("[EmailLoginScreen] sendEmailOtp:start", {
        email: maskEmail(email),
      });
      sendEmailOtpMutation.mutate(
        { email: email.trim(), purpose: "login", language: i18n.language },
        {
          onSuccess: () => {
            console.log("[EmailLoginScreen] sendEmailOtp:success", {
              email: maskEmail(email),
            });
            setShowOtpSentToast(true);
            setResendTimer(60);
            if (step === "OTP") {
              setOtp("");
              setOtpError(null);
            } else {
              setTimeout(() => {
                setStep("OTP");
              }, 500);
            }
          },
          onError: (error: any) => {
            console.error("[EmailLoginScreen] sendEmailOtp:error", {
              email: maskEmail(email),
              message: error?.message,
            });
            const errorMessage = error?.message || "";
            if (
              errorMessage.includes("No account found") ||
              errorMessage.includes("create an account first")
            ) {
              setShowAccountNotFoundModal(true);
              setEmailError(errorMessage);
            } else {
              setEmailError(
                errorMessage || t("emailLoginScreen.failedToSendOtp"),
              );
            }
          },
        },
      );
    }
  };

  const handleVerifyEmailOtp = () => {
    setOtpError(null);
    if (otp.length === 6) {
      console.log("[EmailLoginScreen] verifyEmailOtp:start", {
        email: maskEmail(email),
        otpLength: otp.length,
      });
      verifyEmailOtpMutation.mutate(
        { email: email.trim(), otp },
        {
          onSuccess: async (response: any) => {
            setIsOtpSuccess(true);
            const { user, accessToken, refreshToken, expiresIn, tokenType } =
              response;

            console.log("[EmailLoginScreen] verifyEmailOtp:success", {
              email: maskEmail(email),
              hasUser: !!user,
            });

            // Store tokens in secure storage
            await secureStorage.setObject(config.storage.tokenKey, {
              accessToken,
              refreshToken,
              expiresIn,
              tokenType,
            });
            await secureStorage.setObject(config.storage.userKey, user);

            // Set auth state
            const { setAuth } = useAuthStore.getState();
            setAuth(user, { accessToken, refreshToken, expiresIn, tokenType });

            // Trigger login success callback
            setTimeout(() => {
              onLoginSuccess();
            }, 500);
          },
          onError: (error: any) => {
            console.error("[EmailLoginScreen] verifyEmailOtp:error", {
              email: maskEmail(email),
              message: error?.message,
            });
            setOtpError(t("emailLoginScreen.incorrectOtp"));
            Vibration.vibrate(400);
            Animated.sequence([
              Animated.timing(shakeAnimation, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnimation, {
                toValue: -10,
                duration: 50,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnimation, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnimation, {
                toValue: 0,
                duration: 50,
                useNativeDriver: true,
              }),
            ]).start();
          },
        },
      );
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const idToken = await googleNativeSignIn();
      if (!idToken) return; // cancelled

      console.log(
        "[EmailLoginScreen] Google idToken received, calling backend...",
      );
      googleAuthMutation.mutate(
        { idToken },
        {
          onSuccess: async (response: any) => {
            const {
              user,
              accessToken,
              refreshToken,
              expiresIn,
              tokenType,
              isNewUser,
            } = response;
            console.log("[EmailLoginScreen] googleAuth:success", { isNewUser });

            if (isNewUser && onGoToRegister) {
              // New user — store tokens but do NOT call setAuth yet;
              // let RegisterScreen complete profile setup first.
              await secureStorage.setObject(config.storage.tokenKey, {
                accessToken,
                refreshToken,
                expiresIn,
                tokenType,
              });
              await secureStorage.setObject(config.storage.userKey, user);
              onGoToRegister();
            } else {
              // Existing user — store tokens and set auth state.
              await secureStorage.setObject(config.storage.tokenKey, {
                accessToken,
                refreshToken,
                expiresIn,
                tokenType,
              });
              await secureStorage.setObject(config.storage.userKey, user);
              const { setAuth } = useAuthStore.getState();
              setAuth(user, {
                accessToken,
                refreshToken,
                expiresIn,
                tokenType,
              });
              onLoginSuccess();
            }
          },
          onError: (error: any) => {
            console.error(
              "[EmailLoginScreen] googleAuth:error",
              error?.message,
            );
            setEmailError(
              error?.message || "Google Sign-In failed. Please try again.",
            );
          },
        },
      );
    } catch (error: any) {
      console.error("[EmailLoginScreen] Google Sign-In error:", error?.message);
      setEmailError(
        error?.message || "Failed to open Google Sign-In. Please try again.",
      );
    }
  };

  const handleBack = () => {
    switch (step) {
      case "EMAIL":
        onBack();
        break;
      case "OTP":
        setStep("EMAIL");
        setOtp("");
        setOtpError(null);
        setIsOtpSuccess(false);
        break;
    }
  };

  const getButtonConfig = () => {
    switch (step) {
      case "EMAIL":
        return {
          text: t("registerScreen.continueWithEmail"),
          onPress: handleSendEmailOtp,
          disabled: email.trim().length === 0 || isLoading,
        };
      case "OTP":
        return {
          text: t("registerScreen.continue"),
          onPress: handleVerifyEmailOtp,
          disabled: otp.length < 6 || isLoading,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  const handleOtpChange = (text: string, index: number) => {
    if (otpError) setOtpError(null);

    // Handle paste or multi-character input
    if (text.length > 1) {
      const pastedData = text
        .trim()
        .slice(0, 6 - index)
        .split("");
      const currentOtp = otp.split("");
      // Ensure we have a base to work with
      while (currentOtp.length < 6) currentOtp.push("");

      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 6) {
          currentOtp[index + i] = pastedData[i];
        }
      }

      const finalOtp = currentOtp.join("").slice(0, 6);
      setOtp(finalOtp);

      // Focus the last filled box or the one after
      const nextIndex = Math.min(index + pastedData.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = otp.split("");
    if (text.length > 0) {
      newOtp[index] = text;
      setOtp(newOtp.join(""));
      if (index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    } else {
      newOtp[index] = "";
      setOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otp[index] === "" || otp[index] === undefined) {
        if (index > 0) {
          otpRefs.current[index - 1]?.focus();
          const newOtp = otp.split("");
          newOtp[index - 1] = "";
          setOtp(newOtp.join(""));
        }
      } else {
        const newOtp = otp.split("");
        newOtp[index] = "";
        setOtp(newOtp.join(""));
      }
    }
  };

  // Screen size logic
  const { height, width } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const isExtraSmallScreen = height < 680;

  // Responsive OTP box size — prevents boxes touching on narrow devices (Realme GT ~392px wide)
  const otpBoxWidth = width < 360 ? 37 : width < 392 ? 41 : 45;
  const otpBoxHeight = width < 360 ? 42 : width < 392 ? 46 : 50;

  const illustrationWidth = isExtraSmallScreen ? 90 : isSmallScreen ? 100 : 120;
  const illustrationHeight = isExtraSmallScreen
    ? 120
    : isSmallScreen
      ? 135
      : 160;

  const registerLocalStyles = {
    inputContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginTop: 10,
      marginBottom: 0,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#e0e0e0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1.0,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: "#333333",
      padding: 0,
    },
    errorText: {
      color: "red",
      fontSize: 12,
      marginTop: 2,
      marginHorizontal: 12,
      marginBottom: 8,
    },
    otpContainer: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      marginTop: 20,
      marginBottom: 4,
    },
    otpInput: {
      width: otpBoxWidth,
      height: otpBoxHeight,
      borderWidth: 1,
      borderColor: "#E0E0E0",
      borderRadius: 8,
      backgroundColor: "#FFF8F0",
      textAlign: "center" as const,
      textAlignVertical: "center" as const,
      fontSize: 20,
      fontWeight: "bold" as const,
      color: "#333",
      padding: 0,
      includeFontPadding: false,
    },
    otpSuccess: {
      color: "green",
      fontSize: 12,
      marginTop: 8,
      textAlign: "center" as const,
    },
    separatorContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginVertical: 20,
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: "#e0e0e0",
    },
    separatorText: {
      marginHorizontal: 12,
      color: "#9e9e9e",
      fontSize: 14,
      fontWeight: "500" as const,
    },
    googleButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#e0e0e0",
      paddingVertical: 14,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1.0,
    },
    googleButtonText: {
      color: "#757575",
      fontSize: 16,
      fontWeight: "bold" as const,
    },
  };

  return (
    <View
      style={[styles.container, { paddingBottom: 0, paddingTop: insets.top }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

      {/* Account Not Found Popup */}
      <Modal
        transparent={true}
        visible={showAccountNotFoundModal}
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              paddingHorizontal: 24,
              paddingVertical: 32,
              borderRadius: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              width: "85%",
              maxWidth: 340,
            }}
          >
            <LottieView
              source={require("../../../../../assets/email-popup.json")}
              autoPlay
              loop
              style={{ width: 120, height: 120, marginBottom: 16 }}
            />
            <Text
              style={{
                color: "#333333",
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {t("registerScreen.accountNotFound", "Account Not Found")}
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: 15,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 28,
              }}
            >
              {t(
                "registerScreen.accountNotFoundDesc",
                "No account found with this email. Please create an account first to continue.",
              )}
            </Text>
            <View style={{ width: "100%" }}>
              <Button
                title={t("registerScreen.createAccount", "Create Account")}
                variant="primary"
                fullWidth
                onPress={() => {
                  setShowAccountNotFoundModal(false);
                  if (onGoToRegister) {
                    onGoToRegister();
                  } else {
                    onBack();
                  }
                }}
                style={{ marginBottom: 12 }}
              />
              <Button
                title={t("registerScreen.tryAnotherEmail", "Try Another Email")}
                variant="outline"
                fullWidth
                onPress={() => {
                  setShowAccountNotFoundModal(false);
                  setEmail("");
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* OTP Sent Success Popup */}
      <Modal transparent={true} visible={showOtpSentToast} animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              paddingHorizontal: 24,
              paddingVertical: 20,
              borderRadius: 16,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              minWidth: 200,
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={48}
              color="#4CAF50"
              style={{ marginBottom: 12 }}
            />
            <Text
              style={{
                color: "#333333",
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {t("emailLoginScreen.otpSent")}
            </Text>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#757575" />
              </TouchableOpacity>
              <View style={styles.headerLogoContainer}>
                <Image
                  source={Assets.splashLogo}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.headerText}>DigitalMandir.in</Text>
              </View>
            </View>

            {/* Illustration Area */}
            <View style={styles.illustrationArea}>
              <Image
                source={Assets.signupImage}
                style={[
                  styles.image,
                  {
                    width: illustrationWidth,
                    height: illustrationHeight,
                  },
                ]}
                resizeMode="contain"
              />
              <ChatBubble style={styles.bubbleContainer}>
                <TypewriterText
                  text={bubbleMessages.title}
                  style={styles.bubbleTitle}
                  speed={35}
                  delay={400}
                />
                <TypewriterText
                  text={bubbleMessages.subtitle}
                  style={styles.bubbleSubtitle}
                  speed={30}
                  delay={1200}
                />
              </ChatBubble>
            </View>

            {/* Form Area */}
            <View style={[styles.formContainer, { paddingBottom: 20 }]}>
              {step === "EMAIL" && (
                <>
                  <View
                    style={[
                      registerLocalStyles.inputContainer,
                      isEmailFocused && {
                        borderColor: "#F89626",
                        borderWidth: 1.5,
                      },
                      !!emailError && { borderColor: "red", borderWidth: 1.5 },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={!!emailError ? "red" : "#757575"}
                      style={registerLocalStyles.inputIcon}
                    />
                    <TextInput
                      style={[
                        registerLocalStyles.input,
                        !!emailError && { color: "red" },
                      ]}
                      placeholder={t("registerScreen.emailPlaceholder")}
                      placeholderTextColor="#9e9e9e"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(txt) => {
                        setEmail(txt);
                        if (emailError) setEmailError(null);
                      }}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      editable={!isLoading}
                      autoFocus
                    />
                  </View>
                  {emailError && (
                    <Text style={registerLocalStyles.errorText}>
                      {emailError}
                    </Text>
                  )}
                </>
              )}

              {step === "OTP" && (
                <>
                  <Animated.View
                    style={[
                      registerLocalStyles.otpContainer,
                      { transform: [{ translateX: shakeAnimation }] },
                    ]}
                  >
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const isActive = activeOtpIndex === index;
                      return (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            otpRefs.current[index] = ref;
                          }}
                          style={[
                            registerLocalStyles.otpInput,
                            isActive && {
                              borderColor: "#F89626",
                              borderWidth: 2,
                            },
                            !!otpError && {
                              borderColor: "red",
                              borderWidth: 1,
                            },
                          ]}
                          maxLength={6}
                          keyboardType="number-pad"
                          value={otp[index] || ""}
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={(e) => handleOtpKeyPress(e, index)}
                          onFocus={() => setActiveOtpIndex(index)}
                          onBlur={() => setActiveOtpIndex(null)}
                          editable={!isLoading}
                          autoFocus={index === 0}
                        />
                      );
                    })}
                  </Animated.View>
                  {otpError && (
                    <Text style={registerLocalStyles.errorText}>
                      {otpError}
                    </Text>
                  )}
                  {isOtpSuccess && (
                    <Text style={registerLocalStyles.otpSuccess}>
                      {t("emailLoginScreen.verificationSuccess")}
                    </Text>
                  )}

                  {/* Resend OTP Section */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#666" }}>
                      {t("emailLoginScreen.didntReceiveCode")}{" "}
                    </Text>
                    {resendTimer > 0 ? (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#999",
                          fontWeight: "600",
                        }}
                      >
                        {t("emailLoginScreen.resendIn")}{" "}
                        {formatTime(resendTimer)}
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={handleSendEmailOtp}
                        disabled={isLoading}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#F89626",
                            fontWeight: "bold",
                          }}
                        >
                          {t("registerScreen.resendOtp")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={{ marginTop: "auto", paddingTop: 16 }}>
            <Button
              title={buttonConfig.text}
              variant="primary"
              fullWidth
              onPress={buttonConfig.onPress}
              loading={isLoading}
              disabled={buttonConfig.disabled || isLoading}
            />

            {/* Additional Options for Email Step only */}
            {step === "EMAIL" && !isExpoGo && (
              <>
                <View style={registerLocalStyles.separatorContainer}>
                  <View style={registerLocalStyles.separatorLine} />
                  <Text style={registerLocalStyles.separatorText}>OR</Text>
                  <View style={registerLocalStyles.separatorLine} />
                </View>

                <Button
                  title={t("registerScreen.continueWithGoogle")}
                  variant="outline"
                  fullWidth
                  onPress={handleGoogleSignup}
                  loading={isLoading}
                  leftIcon={<GoogleLogo width={20} height={20} />}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
