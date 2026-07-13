import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, BackHandler, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore, useAppStore } from "../store";
import { useColors } from "../theme";
import {
  IntroScreen,
  LanguageSelector,
  LoginScreen,
  EmailLoginScreen,
  RegisterScreen,
  JaapStartScreen,
  SelectionScreen,
  GodSpecificScreen,
  MantraSelectionScreen,
  MantraJaapScreen,
  TargetCountSelectionScreen,
  JaapCompleteScreen,
  StreakScreen,
  StreakCalendarScreen,
  LeaderboardScreen,
  ProfileScreen,
  LevelScreen,
  INTRO_CONFIG,
  FestivalSelectionScreen,
  CustomMantraScreen,
} from "../components/organisms";
import { BottomNavBar, NavTab } from "../components/organisms/BottomNavBar";

import { changeLanguage } from "../i18n";
import { colors, typography } from "../theme/tokens";
import { secureStorage } from "../utils/storage";
import { config } from "../config";
import { useDeities } from "../api/hooks/useContent";
import { useRecordSession, useUserStats } from "../api/hooks/useJaap";
import { jaapApi, UserStats } from "../api/services/jaapApi";
import { useQueryClient } from "@tanstack/react-query";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { setAuthFailureHandler } from "../api/client/apiClient";

// ── Streak Coin Reward Table ──────────────────────────────────────────────────
// Day 1 = 2 coins, Day 2 = 4 coins, Day 3+ = 5 coins growing by 1 per day (cap 30)
function getStreakCoins(streak: number): number {
  if (streak <= 0) return 0;
  if (streak === 1) return 2;
  if (streak === 2) return 4;
  return Math.min(5 + (streak - 3), 30);
}

// ── Home Tab: Jaap Flow ───────────────────────────────────────────────────────
type HomePhase =
  | "jaap_start"
  | "selection"
  | "deity_selection"
  | "festival_selection"
  | "special_selection"
  | "custom_mantra_selection"
  | "mantra_selection"
  | "target_selection"
  | "mantra_jaap"
  | "jaap_complete"
  | "streak"
  | "streak_calendar";

interface HomeTabProps {
  onPhaseChange: (phase: HomePhase) => void;
  phase: HomePhase;
  onTabChange?: (tab: NavTab) => void;
  isFromGodSpecific: boolean;
  setIsFromGodSpecific: (val: boolean) => void;
  selectedDeity: string | null;
  setSelectedDeity: (val: string | null) => void;
  selectedFestival: string | null;
  setSelectedFestival: (val: string | null) => void;
  selectedMantra: string | undefined;
  setSelectedMantra: (val: string | undefined) => void;
  selectedMantraId: string | undefined;
  setSelectedMantraId: (val: string | undefined) => void;
  selectedMantraAudioUrl: string | undefined;
  setSelectedMantraAudioUrl: (val: string | undefined) => void;
  targetCount: number;
  setTargetCount: (val: number) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  jaapStartTime: number;
  setJaapStartTime: (val: number) => void;
  jaapDurationSeconds: number;
  setJaapDurationSeconds: (val: number) => void;
  setJustCompletedJaap?: (val: boolean) => void;
  setShowStreakCalendar?: (val: boolean) => void;
  onStreakBonusCoins?: (coins: number) => void;
}

function HomeTab({ 
  onPhaseChange, 
  phase, 
  onTabChange,
  isFromGodSpecific,
  setIsFromGodSpecific,
  selectedDeity,
  setSelectedDeity,
  selectedFestival,
  setSelectedFestival,
  selectedMantra,
  setSelectedMantra,
  selectedMantraId,
  setSelectedMantraId,
  selectedMantraAudioUrl,
  setSelectedMantraAudioUrl,
  targetCount,
  setTargetCount,
  selectedCategory,
  setSelectedCategory,
  jaapStartTime,
  setJaapStartTime,
  jaapDurationSeconds,
  setJaapDurationSeconds,
  setJustCompletedJaap,
  setShowStreakCalendar,
  onStreakBonusCoins,
}: HomeTabProps) {
  const recordSession = useRecordSession();
  const { data: apiDeities } = useDeities();
  const queryClient = useQueryClient();
  const [streakBonusCoins, setStreakBonusCoins] = useState(0);
  switch (phase) {
    case "jaap_start":
      return (
        <JaapStartScreen
          onBack={() => { }}
          onStartCounter={() => onPhaseChange("selection")}
        />
      );
    case "selection":
      return (
        <SelectionScreen
          onBack={() => onPhaseChange("jaap_start")}
          onContinue={(selectedId) => {
            setSelectedCategory(selectedId);
            if (selectedId === "god") onPhaseChange("deity_selection");
            else if (selectedId === "festival") onPhaseChange("festival_selection");
            else if (selectedId === "special") onPhaseChange("special_selection");
            else if (selectedId === "custom") onPhaseChange("custom_mantra_selection");
            else onPhaseChange("target_selection"); // Bypass deity & mantra directly to target
          }}
        />
      );
    case "deity_selection":
      return (
        <GodSpecificScreen
          onBack={() => onPhaseChange("selection")}
          onContinue={(deityId) => {
            setIsFromGodSpecific(true);
            setSelectedDeity(deityId);
            setSelectedFestival(null);
            onPhaseChange("mantra_selection");
          }}
        />
      );
    case "festival_selection":
      return (
        <FestivalSelectionScreen
          onBack={() => onPhaseChange("selection")}
          onContinue={(festivalId: any) => {
            setSelectedDeity(null);
            setSelectedFestival(festivalId);
            onPhaseChange("mantra_selection");
          }}
        />
      );
    case "special_selection":
      return (
        <MantraSelectionScreen
          isSpecial={true}
          onBack={() => onPhaseChange("selection")}
          onContinue={(mantra) => {
            setSelectedMantra(mantra.text);
            setSelectedMantraId(mantra.id);
            setSelectedMantraAudioUrl(mantra.audioUrl);
            onPhaseChange("target_selection");
          }}
        />
      );
    case "mantra_selection":
      return (
        <MantraSelectionScreen
          selectedDeity={selectedDeity as any}
          selectedFestival={selectedFestival as any}
          onBack={() => {
            if (selectedDeity) onPhaseChange("deity_selection");
            else if (selectedFestival) onPhaseChange("festival_selection");
            else onPhaseChange("selection"); // fallback
          }}
          onContinue={(mantra) => {
            setSelectedMantra(mantra.text);
            setSelectedMantraId(mantra.id);
            setSelectedMantraAudioUrl(mantra.audioUrl);
            onPhaseChange("target_selection");
          }}
        />
      );
    case "custom_mantra_selection":
      return (
        <CustomMantraScreen
          onBack={() => onPhaseChange("selection")}
          onContinue={(customMantra) => {
            setSelectedMantra(customMantra);
            onPhaseChange("target_selection");
          }}
        />
      );
    case "target_selection":
      return (
        <TargetCountSelectionScreen
          onBack={() => {
            if (isFromGodSpecific) {
              onPhaseChange("mantra_selection");
            } else {
              onPhaseChange("selection");
            }
          }}
          onContinue={(count) => {
            setTargetCount(count);
            setJaapStartTime(Date.now());
            onPhaseChange("mantra_jaap");
          }}
        />
      );
    case "mantra_jaap":
      return (
        <MantraJaapScreen
          mantraText={selectedMantra}
          targetCount={targetCount}
          audioUrl={selectedMantraAudioUrl}
          onBack={() => {
            onPhaseChange("target_selection");
          }}
          onComplete={(durationSeconds: number) => {
            // Store elapsed time from MantraJaapScreen's own timer
            setJaapDurationSeconds(durationSeconds);
            // Record the session via offline-aware mutation
            const duration = durationSeconds;
            const jaapCoins = Math.round(targetCount / 10);

            // Calculate streak bonus coins (only for first jaap today)
            const previousStats = queryClient.getQueryData<UserStats>(['userStats']);
            const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
            const nowIST = new Date(Date.now() + IST_OFFSET_MS);
            const todayIST = `${nowIST.getUTCFullYear()}-${String(nowIST.getUTCMonth() + 1).padStart(2, '0')}-${String(nowIST.getUTCDate()).padStart(2, '0')}`;
            let todayHasSession = false;
            if (previousStats?.lastStreakUpdateAt) {
              const lastUpdate = new Date(previousStats.lastStreakUpdateAt);
              const lastUpdateIST = new Date(lastUpdate.getTime() + IST_OFFSET_MS);
              const lastUpdateDateIST = `${lastUpdateIST.getUTCFullYear()}-${String(lastUpdateIST.getUTCMonth() + 1).padStart(2, '0')}-${String(lastUpdateIST.getUTCDate()).padStart(2, '0')}`;
              todayHasSession = lastUpdateDateIST === todayIST;
            }
            const prospectiveStreak = todayHasSession
              ? (previousStats?.streak || 1)
              : (previousStats?.streak || 0) + 1;
            const streakBonus = todayHasSession ? 0 : getStreakCoins(prospectiveStreak);
            setStreakBonusCoins(streakBonus);
            onStreakBonusCoins?.(streakBonus);
            setJustCompletedJaap?.(true);

            const coinsEarned = jaapCoins + streakBonus;
            recordSession.mutate(
              {
                category: selectedCategory,
                rounds: 1,
                totalBeads: targetCount,
                duration,
                coinsEarned,
                mantraId: selectedMantraId || undefined,
                deityId: apiDeities?.find(d => d.slug === selectedDeity)?._id || undefined,
                // Capture the real completion time now — critical for offline sessions
                // that may be synced hours later when back online.
                completedAt: new Date().toISOString(),
              },
              {
                onError: () => {
                  // Only alert when currently online — if offline, the session was
                  // queued successfully by mutationFn and will sync on reconnect.
                  // No alert is needed: the calendar already shows today as active.
                  const currentlyOnline = useAppStore.getState().isOnline;
                  if (currentlyOnline) {
                    Alert.alert(
                      'Session Save Failed',
                      'Your jaap was completed but could not be saved. Please try again.',
                      [{ text: 'OK' }],
                    );
                  }
                },
              },
            );
            // Also trigger the backend daily check-in to ensure streak increments on completion
            jaapApi.dailyCheckin().catch(() => {});

            // Show JaapCompleteScreen first
            onPhaseChange("jaap_complete");
          }}
        />
      );
    case "jaap_complete":
      return (
        <JaapCompleteScreen
          onBack={() => onPhaseChange("mantra_jaap")}
          onContinue={() => {
            // Go to StreakScreen next (auto-advances to streak_calendar after 3s)
            onPhaseChange("streak");
          }}
          coins={Math.round(targetCount / 10)}
          performance={100}
          duration={jaapDurationSeconds}
        />
      );
    case "streak":
      return (
        <StreakScreen
          onBack={() => onPhaseChange("jaap_complete")}
          onContinue={() => onPhaseChange("streak_calendar")}
          streakDays={1}
          isAutoContinue={true}
          streakCoins={streakBonusCoins}
        />
      );
    case "streak_calendar":
      return (
        <StreakCalendarScreen
          onBack={() => onPhaseChange("streak")}
          onContinue={() => {
            onPhaseChange("selection"); // reset flow
          }}
          isFromJaapCompletion={true}
          onAnotherJaap={() => {
            onPhaseChange("selection"); // start again
          }}
          onCancel={() => {
            if (onTabChange) {
              onTabChange("home");
            }
            onPhaseChange("selection");
          }}
        />
      );
  }
}

// ── Main App Shell with Bottom Nav ────────────────────────────────────────────
function AppShell() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [homePhase, setHomePhase] = useState<HomePhase>("selection");
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [justCompletedJaap, setJustCompletedJaap] = useState(false);
  // Separate flag for daily login bonus (vs post-jaap streak)
  const [isDailyLoginBonus, setIsDailyLoginBonus] = useState(false);
  // Streak bonus coins hoisted here so both HomeTab & streak tab get them
  const [appStreakBonusCoins, setAppStreakBonusCoins] = useState(0);

  // HomeTab State hoisted to preserve across tab changes
  const [isFromGodSpecific, setIsFromGodSpecific] = useState(false);
  const [selectedDeity, setSelectedDeity] = useState<string | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<string | null>(null);
  const [selectedMantra, setSelectedMantra] = useState<string | undefined>(undefined);
  const [selectedMantraId, setSelectedMantraId] = useState<string | undefined>(undefined);
  const [selectedMantraAudioUrl, setSelectedMantraAudioUrl] = useState<string | undefined>(undefined);
  const [targetCount, setTargetCount] = useState<number>(108);
  const [selectedCategory, setSelectedCategory] = useState<string>("god");
  const [jaapStartTime, setJaapStartTime] = useState<number>(Date.now());
  const [jaapDurationSeconds, setJaapDurationSeconds] = useState<number>(0);

  // Keep stats fresh on focus/foreground
  useUserStats();

  // Start background offline sync (content prefetch + queue processing)
  useOfflineSync();

  // ── Hardware Back Button (callback-ref pattern — zero stale closures) ──────────
  // The ref holds the latest handler logic and is updated on every render.
  // The actual BackHandler listener is registered exactly ONCE and delegates to the ref.
  const backHandlerCallbackRef = useRef<() => boolean>(() => false);

  // Update callback on EVERY render — no async useEffect delay, always fresh
  backHandlerCallbackRef.current = () => {
    // 1. Streak calendar overlay is showing — close it first
    if (showStreakCalendar) {
      setShowStreakCalendar(false);
      setJustCompletedJaap(false);
      return true; // consumed — do NOT exit
    }

    // 2. On any non-home tab — return to home selection screen
    if (activeTab !== "home") {
      setActiveTab("home");
      setHomePhase("selection");
      return true; // consumed — do NOT exit
    }

    // 3. On home tab — walk back through the jaap flow phases
    switch (homePhase) {
      case "streak_calendar":
        setHomePhase("streak");
        return true;
      case "streak":
        setHomePhase("jaap_complete");
        return true;
      case "jaap_complete":
        setHomePhase("mantra_jaap");
        return true;
      case "mantra_jaap":
        setHomePhase("target_selection");
        return true;
      case "target_selection":
        setHomePhase(isFromGodSpecific ? "mantra_selection" : "selection");
        return true;
      case "mantra_selection":
        if (selectedDeity) setHomePhase("deity_selection");
        else if (selectedFestival) setHomePhase("festival_selection");
        else setHomePhase("selection");
        return true;
      case "deity_selection":
        setHomePhase("selection");
        return true;
      case "festival_selection":
        setHomePhase("selection");
        return true;
      case "special_selection":
        setHomePhase("selection");
        return true;
      case "custom_mantra_selection":
        setHomePhase("selection");
        return true;
      case "jaap_start":
        setHomePhase("selection");
        return true;
      case "selection":
        setHomePhase("jaap_start");
        return true;
      case "jaap_start":
        // At the absolute root screen — allow the system to exit the app
        return false;
      default:
        return false;
    }
  };

  // Register the BackHandler listener exactly once on mount
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      return backHandlerCallbackRef.current();
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← single registration; callback ref is always up-to-date

  // Daily login check-in removed as requested — streak should only increment on Jaap completion.
  useEffect(() => {
    // We no longer trigger dailyCheckin on app mount.
    // This ensures streaks only increase when the user actually performs a Jaap.
  }, []); // run once on AppShell mount

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab 
            onPhaseChange={setHomePhase} 
            phase={homePhase} 
            onTabChange={setActiveTab} 
            isFromGodSpecific={isFromGodSpecific}
            setIsFromGodSpecific={setIsFromGodSpecific}
            selectedDeity={selectedDeity}
            setSelectedDeity={setSelectedDeity}
            selectedFestival={selectedFestival}
            setSelectedFestival={setSelectedFestival}
            selectedMantra={selectedMantra}
            setSelectedMantra={setSelectedMantra}
            selectedMantraId={selectedMantraId}
            setSelectedMantraId={setSelectedMantraId}
            selectedMantraAudioUrl={selectedMantraAudioUrl}
            setSelectedMantraAudioUrl={setSelectedMantraAudioUrl}
            targetCount={targetCount}
            setTargetCount={setTargetCount}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            jaapStartTime={jaapStartTime}
            setJaapStartTime={setJaapStartTime}
            jaapDurationSeconds={jaapDurationSeconds}
            setJaapDurationSeconds={setJaapDurationSeconds}
            setJustCompletedJaap={setJustCompletedJaap}
            setShowStreakCalendar={setShowStreakCalendar}
            onStreakBonusCoins={(coins) => setAppStreakBonusCoins(coins)}
          />
        );
      case "leaderboard":
        return (
          <LeaderboardScreen
            onBack={() => setActiveTab("home")}
            showContinueButton={false}
            hideHeader={true}
          />
        );
      case "streak":
        if (showStreakCalendar) {
          return (
            <StreakCalendarScreen
              onBack={() => {
                setShowStreakCalendar(false);
                setJustCompletedJaap(false);
              }}
              onContinue={() => {
                setShowStreakCalendar(false);
              }}
              isFromJaapCompletion={justCompletedJaap}
              onAnotherJaap={() => {
                setShowStreakCalendar(false);
                setJustCompletedJaap(false);
                setActiveTab("home");
                setHomePhase("selection");
              }}
              onCancel={() => {
                setShowStreakCalendar(false);
                setJustCompletedJaap(false);
                setActiveTab("home");
                setHomePhase("selection");
              }}
            />
          );
        }
        return (
          <StreakScreen
            onBack={() => {
              setIsDailyLoginBonus(false);
              setActiveTab("home");
            }}
            onContinue={() => {
              if (isDailyLoginBonus) {
                // Daily login flow: just go home after streak screen
                setIsDailyLoginBonus(false);
                setActiveTab("home");
              } else {
                setShowStreakCalendar(true);
              }
            }}
            isAutoContinue={justCompletedJaap || isDailyLoginBonus}
            streakCoins={appStreakBonusCoins}
            onRewardClaimed={() => setAppStreakBonusCoins(0)}
          />
        );
      case "level":
        return <LevelScreen onGoToHome={() => setActiveTab("home")} />;
      case "profile":
        return <ProfileScreen />;
    }
  };

  return (
    <View style={shell.container}>

      <View style={shell.content}>{renderTab()}</View>
      {!(
        activeTab === "home" &&
        (homePhase === "mantra_jaap" || homePhase === "jaap_complete" || homePhase === "streak" || homePhase === "streak_calendar")
      ) && <BottomNavBar activeTab={activeTab} onTabPress={(tab) => {
        if (tab !== "streak") {
          setShowStreakCalendar(false);
          if (tab !== "home") setAppStreakBonusCoins(0); // clear stale bonus when leaving streak
        }
        setJustCompletedJaap(false);
        setIsDailyLoginBonus(false);
        setActiveTab(tab);
      }} />}
    </View>
  );
}

const shell = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[0] },
  content: { flex: 1 },
  screen: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: colors.neutral[800],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[500],
    fontFamily: "Poppins_400Regular",
  },
});

type AppPhase =
  | "intro"
  | "language"
  | "login"
  | "email_login"
  | "register"
  | "jaap_start"
  | "selection"
  | "deity_selection"
  | "festival_selection"
  | "special_selection"
  | "custom_mantra_selection"
  | "mantra_selection"
  | "mantra_jaap"
  | "jaap_complete"
  | "streak"
  | "app"
  | "main_app";

/**
 * Root Navigator component
 * Handles authentication state and navigation flow
 * Shows IntroScreen -> LanguageSelector -> App
 */
export function RootNavigator() {
  const { isAuthenticated, _hasHydrated, clearAuth } = useAuthStore();
  const colors = useColors();
  const [currentPhase, setCurrentPhase] = useState<AppPhase>("intro");
  const [isIntroMinTimeDone, setIsIntroMinTimeDone] = useState(false);

  // Register auth failure handler once on mount so token refresh failures clear auth state
  useEffect(() => {
    setAuthFailureHandler(clearAuth);
  }, [clearAuth]);

  // Navigation State to remember where we came from
  const [isFromGodSpecific, setIsFromGodSpecific] = useState(false);

  // Pending auth data for new users coming from login screen
  const [pendingAuthForRegister, setPendingAuthForRegister] = useState<{ user: any; tokens: any } | null>(null);

  // 0. Restore saved language preference on app start
  useEffect(() => {
    (async () => {
      const savedLang = await secureStorage.getItem(config.storage.languageKey);
      if (savedLang) {
        changeLanguage(savedLang);
      }
    })();
  }, []);

  // 1. Handle Intro Screen Minimum Duration
  useEffect(() => {
    const introTimer = setTimeout(() => {
      setIsIntroMinTimeDone(true);
    }, INTRO_CONFIG?.animationDuration || 3000);

    return () => clearTimeout(introTimer);
  }, []);

  // 2. Handle Transition from Intro based on Auth State
  // Transition only when:
  // a) Intro minimum time is done AND
  // b) App has hydrated (loaded persistence)
  useEffect(() => {
    if (currentPhase === "intro" && isIntroMinTimeDone && _hasHydrated) {
      // If user is already authenticated, skip onboarding entirely
      if (isAuthenticated) {
        setCurrentPhase("main_app");
      } else {
        setCurrentPhase("language");
      }
    }
  }, [currentPhase, isIntroMinTimeDone, _hasHydrated, isAuthenticated]);

  // Handle Hardware Back Button — UNAUTHENTICATED FLOW ONLY.
  // When authenticated, AppShell is the sole BackHandler authority.
  // We skip registration entirely here so AppShell's handler wins without conflict.
  useEffect(() => {
    // Do nothing when authenticated — AppShell owns back navigation
    if (isAuthenticated) return;

    const handleBackPress = () => {
      // Intro/splash — do not intercept
      if (currentPhase === "intro") {
        return false;
      }

      // Handle specific sub-phases for auth screens
      if (currentPhase === "email_login" || currentPhase === "register") {
        setPendingAuthForRegister(null);
        setCurrentPhase("login");
        return true;
      }

      // On login/language screen — allow system exit
      return false;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => backHandlerSubscription.remove();
  }, [currentPhase, isAuthenticated]);

  const handleLanguageSelect = async (language: string) => {
    changeLanguage(language);
    // Persist language selection so it survives app restarts
    await secureStorage.setItem(config.storage.languageKey, language);
    console.log("Selected Language:", language);
    setCurrentPhase("app");
  };

  // Render Logic

  // Show intro screen
  if (currentPhase === "intro") {
    return <IntroScreen />;
  }

  // Show language selector
  if (currentPhase === "language") {
    return (
      <LanguageSelector
        onSelectLanguage={handleLanguageSelect}
        onBack={() => console.log("Back pressed")} // No back action defined in requirements for this screen specifically in flow
      />
    );
  }

  // Show main app shell only when authenticated.
  // Relying on phase alone causes logout to stay in AppShell and show profile load errors.
  if (isAuthenticated) {
    return <AppShell />;
  }

  // Unauthenticated Flow
  if (currentPhase === "email_login") {
    return (
      <EmailLoginScreen
        onBack={() => setCurrentPhase("login")}
        onGoToRegister={() => setCurrentPhase("register")}
        onLoginSuccess={() => {
          console.log("Login Success");
          setCurrentPhase("main_app");
        }}
      />
    );
  }

  // Register Flow
  if (currentPhase === "register") {
    return (
      <RegisterScreen
        onBack={() => {
          setPendingAuthForRegister(null);
          setCurrentPhase("login");
        }}
        pendingAuth={pendingAuthForRegister}
        onRegisterSuccess={() => {
          console.log("Register Success");
          setPendingAuthForRegister(null);
          setCurrentPhase("main_app");
        }}
      />
    );
  }

  // Fallback / Initial state after language (shows login)
  return (
    <LoginScreen
      onLogin={() => setCurrentPhase("email_login")}
      onSignup={() => setCurrentPhase("register")}
    />
  );
}

// Export screens for use when proper navigation is set up
export { AppShell, LoginScreen, RegisterScreen };
