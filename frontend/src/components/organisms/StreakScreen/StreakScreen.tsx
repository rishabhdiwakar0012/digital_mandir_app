import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Image, Animated, Easing, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Text as SvgText } from 'react-native-svg';
import { styles } from './styles';
import * as hapticUtils from '../../../utils/hapticUtils';
import { useUserStats, useUserSessions } from '../../../api/hooks/useJaap';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button';
const CoinIcon = require('../../../../assets/coin.png');
const LogoBg = require('../../../../assets/logo.webp');

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 900;

interface StreakScreenProps {
    onBack?: () => void;
    onContinue: () => void;
    streakDays?: number;
    isAutoContinue?: boolean;
    streakCoins?: number;
    onRewardClaimed?: () => void;
}

// Compute streak bonus coins from streak day count
function getStreakReward(n: number): number {
    if (n <= 0) return 0;
    if (n === 1) return 2;
    if (n === 2) return 4;
    return Math.min(5 + (n - 3), 30);
}

export const StreakScreen: React.FC<StreakScreenProps> = ({
    onBack,
    onContinue,
    streakDays: initialStreak = 1,
    isAutoContinue = false,
    streakCoins = 0,
    onRewardClaimed,
}) => {
    const insets = useSafeAreaInsets();
    const { data: stats } = useUserStats();
    const { data: sessions } = useUserSessions(1, 50);
    const streak = isAutoContinue ? Math.max(stats?.streak || 0, 1) : (stats?.streak ?? initialStreak);
    const { t } = useTranslation();

    const spinValue = useRef(new Animated.Value(0)).current;
    const bgSpinValue = useRef(new Animated.Value(0)).current;

    // Streak reward popup state
    const [showRewardPopup, setShowRewardPopup] = useState(false);
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const popupOpacity = useRef(new Animated.Value(0)).current;
    const popupScale = useRef(new Animated.Value(0.72)).current;
    const coinBounceY = useRef(new Animated.Value(0)).current;
    const coinRotate = useRef(new Animated.Value(0)).current;
    // Use a ref to avoid stale closure issues in useEffect
    const popupTriggeredRef = useRef(false);

    // If prop is 0 but isAutoContinue (came from jaap), compute from live streak as fallback
    const effectiveCoins = streakCoins > 0 ? streakCoins : (isAutoContinue ? getStreakReward(streak) : 0);
    const shouldShowPopup = isAutoContinue && effectiveCoins > 0;

    const startBgSpin = () => {
        bgSpinValue.setValue(0);
        Animated.timing(bgSpinValue, {
            toValue: 1,
            duration: 20000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) startBgSpin();
        });
    };

    // Show reward popup after a short delay — use ref + re-check when streak loads
    useEffect(() => {
        if (!isAutoContinue) return;
        const timer = setTimeout(() => {
            // Re-evaluate coins now (avoids stale closure; streak may have loaded by now)
            const coins = streakCoins > 0 ? streakCoins : getStreakReward(streak);
            if (coins <= 0 || popupTriggeredRef.current) return;
            popupTriggeredRef.current = true;
            setShowRewardPopup(true);
            hapticUtils.notificationAsync(hapticUtils.NotificationFeedbackType.Success);
            Animated.parallel([
                Animated.spring(popupOpacity, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }),
                Animated.spring(popupScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }),
            ]).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(coinBounceY, { toValue: -14, duration: 380, easing: Easing.out(Easing.sin), useNativeDriver: true }),
                    Animated.timing(coinBounceY, { toValue: 0, duration: 380, easing: Easing.in(Easing.sin), useNativeDriver: true }),
                ])
            ).start();
            // Tilt oscillation: shimmer effect (NOT 360° spin — flat PNG collapses at 90°)
            Animated.loop(
                Animated.sequence([
                    Animated.timing(coinRotate, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(coinRotate, { toValue: -1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(coinRotate, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ])
            ).start();
        }, 800);
        return () => clearTimeout(timer);
    }, [isAutoContinue, streak, streakCoins]); // re-runs when streak data loads

    // Auto-advance — pauses while popup is open and unclaimed
    useEffect(() => {
        if (!isAutoContinue) return;
        if (showRewardPopup && !rewardClaimed) return;
        const timer = setTimeout(() => {
            onContinue();
        }, 3000);
        return () => clearTimeout(timer);
    }, [isAutoContinue, showRewardPopup, rewardClaimed]);

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 4000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        startBgSpin();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const bgSpin = bgSpinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const coinRotateInterp = coinRotate.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-14deg', '0deg', '14deg'],
    });

    const handleClaimReward = () => {
        hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Medium);
        Animated.parallel([
            Animated.timing(popupOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            Animated.timing(popupScale, { toValue: 0.75, duration: 220, useNativeDriver: true }),
        ]).start(() => {
            setShowRewardPopup(false);
            setRewardClaimed(true);
            onRewardClaimed?.();
        });
    };

    // Generate last 7 days ending mostly today
    const getLast7Days = () => {
        const days = [];
        const dayNames = [
            t('streakScreen.days.SU'), 
            t('streakScreen.days.M'), 
            t('streakScreen.days.TU'), 
            t('streakScreen.days.W'), 
            t('streakScreen.days.TH'), 
            t('streakScreen.days.F'), 
            t('streakScreen.days.SA')
        ];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            // Assuming today is active, we subtract index days
            d.setDate(d.getDate() - i);
            days.push(dayNames[d.getDay()]);
        }
        return days;
    };

    const weekDays = getLast7Days();

    // Build a set of date strings (YYYY-MM-DD) from actual session history
    const sessionDateSet = new Set<string>();
    if (sessions?.items) {
        sessions.items.forEach((s: any) => {
            const d = new Date(s.completedAt);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            sessionDateSet.add(`${y}-${m}-${day}`);
        });
    }

    // For each of the last 7 days, check if there's an actual session on that date
    const activeIndices: number[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        const isToday = i === 0;
        if (sessionDateSet.has(dateStr) || (isAutoContinue && isToday)) {
            activeIndices.push(6 - i);
        }
    }

    return (
        <View style={[styles.container]}>
            <LinearGradient
                colors={['#FFFFFF', '#FFF7E6', '#FFE4A0']} // Premium soft gold sunrise gradient
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <View style={{ flex: 1, paddingTop: insets.top }}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                {/* Main Content */}
                <View style={styles.contentContainer}>
                    <View style={styles.innerContent}>

                        <View style={styles.streakNumberContainer}>
                            {/* Logo Background */}
                            <Animated.Image 
                                source={LogoBg} 
                                style={{
                                    position: 'absolute',
                                    width: isSmallScreen ? 190 : 240,
                                    height: isSmallScreen ? 190 : 240,
                                    opacity: 0.15,
                                    zIndex: 0,
                                    transform: [{ rotate: bgSpin }],
                                }} 
                                resizeMode="contain" 
                            />
                            {/* Main text using SVG for perfect stroke */}
                            {(() => {
                                const digits = String(streak).length;
                                const fontSize = digits >= 3
                                    ? (isSmallScreen ? 56 : 70)
                                    : (isSmallScreen ? 76 : 95);
                                const svgWidth = digits >= 3
                                    ? (isSmallScreen ? 170 : 210)
                                    : (isSmallScreen ? 120 : 150);
                                const svgHeight = digits >= 3
                                    ? (isSmallScreen ? 80 : 100)
                                    : (isSmallScreen ? 96 : 120);
                                const cx = svgWidth / 2;
                                const cy = svgHeight - 20;
                                return (
                                    <Svg height={svgHeight} width={svgWidth} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ zIndex: 1 }}>
                                        <SvgText
                                            fill="#FFFFFF"
                                            stroke="#F89626"
                                            strokeWidth="6"
                                            strokeLinejoin="round"
                                            fontSize={fontSize}
                                            fontFamily="Poppins_700Bold"
                                            x={cx}
                                            y={cy}
                                            textAnchor="middle"
                                        >
                                            {streak}
                                        </SvgText>
                                    </Svg>
                                );
                            })()}
                        </View>

                        <Text style={styles.streakTitleText}>{t('streakScreen.dayStreak')}</Text>

                        <View style={styles.coinsIconContainer}>
                            <Image source={CoinIcon} style={{ width: isSmallScreen ? 56 : 72, height: isSmallScreen ? 56 : 72 }} resizeMode="contain" />
                        </View>

                        {/* Days Container Wrapper for Animated Border */}
                        <View style={styles.daysCardWrapper}>
                            {/* Spinning Gradient Border */}
                            <Animated.View style={[styles.animatedBorderContainer, { transform: [{ rotate: spin }] }]}>
                                <LinearGradient
                                    colors={['rgba(248, 150, 38, 0)', '#F89626', 'rgba(248, 150, 38, 0)', '#F89626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.animatedGradient}
                                />
                            </Animated.View>

                            {/* Inner Glass Card */}
                            <View style={styles.daysCardInner}>
                                <View style={styles.daysRow}>
                                    {weekDays.map((day, index) => {
                                        const isCompleted = activeIndices.includes(index);
                                        return (
                                            <View key={index} style={styles.dayItem}>
                                                <Text style={[styles.dayText, isCompleted && styles.dayTextActive]}>{day}</Text>
                                                {isCompleted ? (
                                                    <View style={styles.completedDayCircle}>
                                                        <Ionicons name="checkmark" size={20} color="#FFFFFF" strokeWidth={3} />
                                                    </View>
                                                ) : (
                                                    <View style={styles.emptyDayCircle} />
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                                <Text style={styles.descriptionText}>
                                    {t('streakScreen.description')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer Button */}
                <View style={[styles.footer, { paddingBottom: Math.max(isSmallScreen ? 16 : 28, insets.bottom + (isSmallScreen ? 12 : 20)) }]}>
                    <Button
                        title={t('streakScreen.viewCalendar')}
                        variant="primary"
                        fullWidth
                        onPress={() => {
                            hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                            onContinue();
                        }}
                    />
                </View>
            </View>

            {/* Streak Reward Popup */}
            <Modal
                visible={showRewardPopup}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={handleClaimReward}
            >
                {/* Backdrop — tap outside to claim */}
                <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={handleClaimReward}>

                    {/* Card outer shadow wrapper */}
                    <Animated.View
                        style={[styles.popupCard, { opacity: popupOpacity, transform: [{ scale: popupScale }] }]}
                    >
                        {/* Close × button — top-right corner */}
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); handleClaimReward(); }}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                zIndex: 10,
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: 'rgba(0,0,0,0.08)',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="close" size={17} color="#888" />
                        </TouchableOpacity>

                        {/* Gold accent strip at top */}
                        <View style={styles.popupGoldStrip}>
                            <LinearGradient
                                colors={['#F89626', '#FFD166', '#F89626']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ flex: 1 }}
                            />
                        </View>

                        {/* Content — plain View, no extra TouchableOpacity */}
                        <View style={styles.popupContent}>

                            {/* Star sparkles row */}
                            <View style={styles.popupStarRow}>
                                <Ionicons name="star" size={14} color="#F89626" />
                                <Ionicons name="star" size={18} color="#F89626" style={{ marginHorizontal: 8 }} />
                                <Ionicons name="star" size={14} color="#F89626" />
                            </View>

                            {/* Animated Coin */}
                            <Animated.Image
                                source={CoinIcon}
                                style={[
                                    styles.popupCoinIcon,
                                    { transform: [{ translateY: coinBounceY }, { rotate: coinRotateInterp }] },
                                ]}
                                resizeMode="contain"
                            />

                            {/* Title */}
                            <Text style={styles.popupTitle}>{t('streakScreen.rewardTitle')}</Text>

                            {/* Streak day badge pill */}
                            <View style={styles.popupDayBadge}>
                                <Text style={styles.popupDayBadgeText}>
                                    {t('streakScreen.rewardSubtitle', { streak })}
                                </Text>
                            </View>

                            {/* Coins amount card */}
                            <View style={styles.popupCoinsRow}>
                                <Text style={styles.popupCoinsAmount}>+{effectiveCoins}</Text>
                                <Text style={styles.popupCoinsLabel}>{t('streakScreen.rewardCoins')}</Text>
                            </View>

                            {/* Claim button — stops propagation to overlay */}
                            <TouchableOpacity
                                style={styles.popupClaimButton}
                                onPress={(e) => { e.stopPropagation?.(); handleClaimReward(); }}
                                activeOpacity={0.82}
                            >
                                <Text style={styles.popupClaimButtonText}>{t('streakScreen.rewardClaim')}</Text>
                            </TouchableOpacity>

                        </View>
                    </Animated.View>

                </TouchableOpacity>
            </Modal>
        </View>
    );
};
