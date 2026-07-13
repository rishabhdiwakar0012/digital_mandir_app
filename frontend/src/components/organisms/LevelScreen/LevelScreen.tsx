import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Animated,
    Easing,
    Modal,
    StatusBar,
    StyleSheet,
    RefreshControl,
    Pressable,
    SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Text as SvgText } from 'react-native-svg';
import * as hapticUtils from '../../../utils/hapticUtils';
import { useUserStats, useUserSessions } from '../../../api/hooks/useJaap';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button';
import { styles } from './styles';

const JAAP_PER_LEVEL = 1000;
const LogoBg = require('../../../../assets/logo.webp');
const COIN_IMG = require('../../../../assets/coin.png');

import { LevelMapOverlay, MilestoneDef } from './LevelMapOverlay';

export const MILESTONES = [
    { level: 1, titleKey: 'levelScreen.milestoneNames.noviceDevotee', emoji: '🌱' },
    { level: 5, titleKey: 'levelScreen.milestoneNames.devotedSeeker', emoji: '🪔' },
    { level: 10, titleKey: 'levelScreen.milestoneNames.spiritualSeeker', emoji: '🌸' },
    { level: 20, titleKey: 'levelScreen.milestoneNames.trueBhakt', emoji: '🕉️' },
    { level: 50, titleKey: 'levelScreen.milestoneNames.enlightenedSoul', emoji: '✨' },
    { level: 100, titleKey: 'levelScreen.milestoneNames.divineDevotee', emoji: '🌟' },
];

export const getMilestoneForLevel = (level: number): MilestoneDef => {
    let matched = MILESTONES[0];
    for (const ms of MILESTONES) {
        if (level >= ms.level) {
            matched = ms;
        } else {
            break;
        }
    }
    return matched;
};

export interface LevelScreenProps {
    onGoToHome?: () => void;
}

export const LevelScreen: React.FC<LevelScreenProps> = ({ onGoToHome }) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const formatDate = useCallback((iso: string): string => {
        const d = new Date(iso);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

        const diffDays = Math.round((startOfToday - dDate) / 86400000);

        if (diffDays === 0) return t('levelScreen.today');
        if (diffDays === 1) return t('levelScreen.yesterday');
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }, [t]);

    const { data: stats, refetch: refetchStats } = useUserStats();
    const { data: sessionsData, refetch: refetchSessions } = useUserSessions(1, 30);

    const [isRefreshing, setIsRefreshing] = useState(false);

    // ─── Real data from API ────────────────────────────────────────────────────
    const totalBeads = stats?.totalBeads ?? 0;
    const totalSessions = stats?.totalJaapSessions ?? 0;
    const totalCoins = stats?.totalCoins ?? 0;
    const totalRounds = stats?.totalRounds ?? 0;
    const currentLevel = Math.floor(totalBeads / JAAP_PER_LEVEL) + 1;
    const progress = totalBeads % JAAP_PER_LEVEL;
    const progressFrac = progress / JAAP_PER_LEVEL;
    const remaining = JAAP_PER_LEVEL - progress;

    const groupedHistoryItems = useMemo(() => {
        const items = sessionsData?.items ?? [];
        const grouped = new Map<string, typeof items[0]>();

        items.forEach(session => {
            const d = new Date(session.completedAt);
            const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const key = `${dateKey}_${session.totalBeads}`;

            if (grouped.has(key)) {
                const existing = grouped.get(key)!;
                existing.rounds = Number(existing.rounds) + Number(session.rounds);
                if (new Date(session.completedAt) > new Date(existing.completedAt)) {
                    existing.completedAt = session.completedAt;
                }
            } else {
                grouped.set(key, { ...session });
            }
        });

        const flatList = Array.from(grouped.values())
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        const sections: { title: string, data: typeof items }[] = [];
        flatList.forEach(session => {
            const label = formatDate(session.completedAt);
            let section = sections.find(s => s.title === label);
            if (!section) {
                section = { title: label, data: [] };
                sections.push(section);
            }
            section.data.push(session);
        });

        return { flatList, sections };
    }, [sessionsData?.items, formatDate]);

    const recentFlatList = groupedHistoryItems.flatList.slice(0, 5);

    // ─── Animations ───────────────────────────────────────────────────────────
    const bgSpinValue = useRef(new Animated.Value(0)).current;
    const borderSpinValue = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.88)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const celebScaleAnim = useRef(new Animated.Value(0)).current;
    const celebOpacAnim = useRef(new Animated.Value(0)).current;
    const celebBounceAnim = useRef(new Animated.Value(1)).current;

    // ─── Level-Up Detection ───────────────────────────────────────────────────
    const prevLevelRef = useRef<number | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [levelUpLevel, setLevelUpLevel] = useState(0);
    const [selectedMilestone, setSelectedMilestone] = useState<typeof MILESTONES[0] | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showLetsJaap, setShowLetsJaap] = useState(false);

    const handleLetsJaapTransition = useCallback(() => {
        hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Medium);
        setSelectedMilestone(null);
        setShowMap(false); // <--- Crucial: cleanly dismisses the Map if it was open
        setShowLetsJaap(true);
        setTimeout(() => {
            setShowLetsJaap(false);
            onGoToHome?.();
        }, 1500);
    }, [onGoToHome]);

    const startBgSpin = useCallback(() => {
        bgSpinValue.setValue(0);
        Animated.timing(bgSpinValue, {
            toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true,
        }).start(({ finished }) => { if (finished) startBgSpin(); });
    }, [bgSpinValue]);

    // Mount animations
    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1, tension: 65, friction: 8, useNativeDriver: true,
        }).start();
        Animated.loop(
            Animated.timing(borderSpinValue, {
                toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true,
            })
        ).start();
        startBgSpin();
    }, []);

    // Progress bar animation whenever data refreshes
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progressFrac, duration: 1400,
            easing: Easing.out(Easing.cubic), useNativeDriver: false,
        }).start();
    }, [progressFrac]);

    // Level-up trigger
    useEffect(() => {
        if (prevLevelRef.current === null) {
            prevLevelRef.current = currentLevel;
            return;
        }
        if (currentLevel > prevLevelRef.current) {
            prevLevelRef.current = currentLevel;
            setLevelUpLevel(currentLevel);
            setShowLevelUp(true);
            hapticUtils.notificationAsync(hapticUtils.NotificationFeedbackType.Success);
        }
    }, [currentLevel]);

    // Handle level up animation when modal becomes visible
    useEffect(() => {
        let loopAnim: Animated.CompositeAnimation | null = null;
        if (showLevelUp) {
            celebScaleAnim.setValue(0);
            celebOpacAnim.setValue(0);
            celebBounceAnim.setValue(1);
            Animated.parallel([
                Animated.spring(celebScaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
                Animated.timing(celebOpacAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start(({ finished }) => {
                if (finished && showLevelUp) {
                    // Pulse the level number 3 times
                    loopAnim = Animated.loop(
                        Animated.sequence([
                            Animated.timing(celebBounceAnim, {
                                toValue: 1.18, duration: 280, easing: Easing.out(Easing.back(2)), useNativeDriver: true,
                            }),
                            Animated.timing(celebBounceAnim, {
                                toValue: 1, duration: 280, easing: Easing.in(Easing.ease), useNativeDriver: true,
                            }),
                        ]),
                        { iterations: 3 }
                    );
                    loopAnim.start();
                }
            });
        }
        return () => {
            if (loopAnim) {
                loopAnim.stop();
            }
        };
    }, [showLevelUp, celebScaleAnim, celebOpacAnim, celebBounceAnim]);

    // Pull-to-refresh handler
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([refetchStats(), refetchSessions()]);
        setIsRefreshing(false);
    }, [refetchStats, refetchSessions]);

    // ─── Derived display values ────────────────────────────────────────────────
    const bgSpin = bgSpinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const borderSpin = borderSpinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    const achievedMilestones = MILESTONES.filter(m => currentLevel >= m.level);
    const currentTitleKey = getMilestoneForLevel(currentLevel).titleKey;

    const nextMilestone = MILESTONES.find(m => m.level > currentLevel);
    const jaapToNextMilestone = nextMilestone
        ? nextMilestone.level * JAAP_PER_LEVEL - totalBeads : 0;

    const quoteKey = `levelScreen.quotes.q${currentLevel % 5}`;

    const displayStartRow = Math.max(1, currentLevel);
    const levelsToShowGrid = [displayStartRow, displayStartRow + 1, displayStartRow + 2, displayStartRow + 3, displayStartRow + 4];

    // SVG level number sizing
    const levelDigits = String(currentLevel).length;
    const svgFontSize = levelDigits >= 3 ? 56 : levelDigits === 2 ? 70 : 90;
    const svgW = levelDigits >= 3 ? 200 : levelDigits === 2 ? 150 : 120;
    const svgH = levelDigits >= 3 ? 76 : 100;

    return (
        <View style={styles.root}>
            {/* Same cream-gold gradient as StreakScreen */}
            <LinearGradient
                colors={['#FFFFFF', '#FFF7E6', '#FFE4A0']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* ─── Header ─────────────────────────────────────────────────── */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>🕉️ {t('levelScreen.title')}</Text>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#F89626"
                        colors={['#F89626']}
                    />
                }
            >
                {/* ─── Hero: Spinning logo watermark + SVG level number ────── */}
                <Animated.View style={[styles.heroContainer, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Rotating watermark: identical pattern to StreakScreen */}
                    <Animated.Image
                        source={LogoBg}
                        style={[styles.heroBgLogo, { transform: [{ rotate: bgSpin }] }]}
                        resizeMode="contain"
                    />

                    <Text style={styles.heroLabel}>{t('levelScreen.levelLabel')}</Text>

                    {/* SVG level number — white filled, saffron stroke */}
                    <Svg height={svgH} width={svgW} viewBox={`0 0 ${svgW} ${svgH}`} style={{ zIndex: 1 }}>
                        <SvgText
                            fill="#FFFFFF"
                            stroke="#F89626"
                            strokeWidth="6"
                            strokeLinejoin="round"
                            fontSize={svgFontSize}
                            fontFamily="Poppins_700Bold"
                            x={svgW / 2}
                            y={svgH - 14}
                            textAnchor="middle"
                        >
                            {currentLevel}
                        </SvgText>
                    </Svg>

                    <Text style={styles.heroTitle}>{t(currentTitleKey)}</Text>
                </Animated.View>

                {/* ─── Progress card with rotating gradient border ─────────── */}
                <View style={styles.spinCardWrapper}>
                    {/* Spinning gradient border — same as StreakScreen daysCardWrapper */}
                    <Animated.View style={[styles.spinBorderContainer, { transform: [{ rotate: borderSpin }] }]}>
                        <LinearGradient
                            colors={['rgba(248,150,38,0)', '#F89626', 'rgba(248,150,38,0)', '#F89626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </Animated.View>

                    <View style={styles.spinCardInner}>
                        <View style={styles.progressHeaderRow}>
                            <Text style={styles.progressTitle}>
                                {t('levelScreen.progressTo', { level: currentLevel + 1 })}
                            </Text>
                            <Text style={styles.progressPct}>{Math.round(progressFrac * 100)}%</Text>
                        </View>

                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
                                <LinearGradient
                                    colors={['#FFD54F', '#F89626', '#E65100']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFillObject}
                                />
                            </Animated.View>
                        </View>

                        <View style={styles.progressFooterRow}>
                            <Text style={styles.progressCountBold}>{progress.toLocaleString()}</Text>
                            <Text style={styles.progressCountMuted}> / 1,000  •  </Text>
                            <Text style={styles.progressRemaining}>
                                {remaining.toLocaleString()} {t('levelScreen.toGo')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ─── 2×2 Stats Grid (live from API) ─────────────────────── */}
                <View style={styles.statsGrid}>
                    {([
                        { emoji: '📿', value: totalBeads.toLocaleString(), label: t('levelScreen.totalJaap'), c: ['#FFF3E0', '#FFE0B2'] },
                        { emoji: '⭐', value: String(currentLevel), label: t('levelScreen.currentLevel'), c: ['#FFFDE7', '#FFF9C4'] },
                        { emoji: '🧿', value: totalSessions.toLocaleString(), label: t('levelScreen.totalSessions'), c: ['#F3E5F5', '#E1BEE7'] },
                        { image: COIN_IMG, value: totalCoins.toLocaleString(), label: t('levelScreen.totalCoins'), c: ['#FFF8E1', '#FFECB3'] },
                    ] as const).map((s, i) => (
                        <View key={i} style={styles.statCard}>
                            <LinearGradient
                                colors={s.c as [string, string]}
                                style={styles.statGradient}
                            >
                                {'image' in s ? (
                                    <View style={{ height: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                                        <Image source={(s as any).image} style={{ width: 28, height: 28 }} resizeMode="contain" />
                                    </View>
                                ) : (
                                    <Text style={styles.statEmoji}>{(s as any).emoji}</Text>
                                )}
                                <Text style={styles.statValue}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </LinearGradient>
                        </View>
                    ))}
                </View>

                {/* ─── Motivational Quote ──────────────────────────────────── */}
                <View style={styles.quoteCard}>
                    <Text style={styles.quoteIcon}>🙏</Text>
                    <Text style={styles.quoteText}>"{t(quoteKey)}"</Text>
                </View>

                {/* ─── Recent Sessions (live from API) ─────────────────────── */}
                {recentFlatList.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>🕐  {t('levelScreen.recentSessions')}</Text>

                        {recentFlatList.map((session, idx) => {
                            const dateLabel = formatDate(session.completedAt);
                            const prevSession = idx > 0 ? recentFlatList[idx - 1] : null;
                            const prevDateLabel = prevSession ? formatDate(prevSession.completedAt) : null;
                            const showHeader = dateLabel !== prevDateLabel;

                            return (
                                <React.Fragment key={session._id}>
                                    {showHeader && (
                                        <View style={styles.historySectionHeader}>
                                            <Text style={styles.historySectionTitle}>{dateLabel}</Text>
                                        </View>
                                    )}
                                    <View style={styles.sessionCard}>
                                        <View style={styles.sessionLeft}>
                                            <View style={styles.sessionIconBox}>
                                                <Text style={styles.sessionIconEmoji}>📿</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.sessionBeads}>
                                                    {session.totalBeads.toLocaleString()} {t('levelScreen.beads')}
                                                </Text>
                                                <Text style={styles.sessionSubtitle}>
                                                    {new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.sessionRoundsBadge}>
                                            <Text style={styles.sessionRounds}>
                                                {session.rounds} {t('levelScreen.rounds')}
                                            </Text>
                                        </View>
                                    </View>
                                </React.Fragment>
                            );
                        })}

                        {groupedHistoryItems.flatList.length > 5 && (
                            <TouchableOpacity
                                style={styles.viewAllButton}
                                onPress={() => setShowHistoryModal(true)}
                            >
                                <Text style={styles.viewAllText}>{t('levelScreen.viewAll')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* ─── Sequential Levels Grid ─────────────────────────────────────── */}
                <View style={styles.milestonesSection}>
                    <Text style={styles.sectionTitle}>🏆  {t('levelScreen.milestones')}</Text>
                    <View style={styles.milestonesGrid}>
                        {levelsToShowGrid.map((lvl) => {
                            const achieved = currentLevel >= lvl;
                            const isCurrent = currentLevel === lvl;
                            const ms = getMilestoneForLevel(lvl);
                            
                            return (
                                <Pressable
                                    key={`grid-lvl-${lvl}`}
                                    style={({ pressed }) => [
                                        styles.milestoneCard,
                                        achieved && styles.milestoneCardAchieved,
                                        isCurrent && styles.milestoneCardCurrent,
                                        pressed && styles.milestoneCardPressed,
                                    ]}
                                    onPress={() => {
                                        hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                        setSelectedMilestone({ ...ms, level: lvl });
                                    }}
                                >
                                    {achieved && (
                                        <LinearGradient
                                            colors={isCurrent
                                                ? ['#FFD54F', '#F89626', '#E65100']
                                                : ['#FFB347', '#E65100']}
                                            style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    )}
                                    {isCurrent && (
                                        <View style={styles.currentBadge}>
                                            <Text style={styles.currentBadgeText}>NOW</Text>
                                        </View>
                                    )}
                                    <Text style={styles.milestoneEmoji}>{ms.emoji}</Text>
                                    <Text style={[styles.milestoneLevel, achieved && styles.textWhite80]}>
                                        {t('levelScreen.levelShort', { level: lvl })}
                                    </Text>
                                    <Text style={[styles.milestoneTitle, achieved && styles.textWhite]}>
                                        {t(ms.titleKey)}
                                    </Text>
                                    <View style={[styles.badgeCorner, achieved ? styles.badgeDone : styles.badgeLocked]}>
                                        <Ionicons
                                            name={achieved ? 'checkmark' : 'lock-closed'}
                                            size={9}
                                            color={achieved ? '#FFF' : '#9E9E9E'}
                                        />
                                    </View>
                                </Pressable>
                            );
                        })}

                        {/* View All / Map Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.milestoneCard,
                                styles.viewAllGridCard,
                                pressed && styles.milestoneCardPressed,
                            ]}
                            onPress={() => {
                                hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Medium);
                                setShowMap(true);
                            }}
                        >
                            <View style={styles.viewAllGridInner}>
                                <Text style={styles.milestoneEmoji}>🗺️</Text>
                                <Text style={styles.milestoneTitleMap}>{t('levelScreen.viewAll')}</Text>
                                <Text style={styles.milestoneSubtextMap}>Path Map</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* ─── Next Milestone Banner ───────────────────────────────── */}
                {nextMilestone && (
                    <LinearGradient
                        colors={['#FFF8E1', '#FFE0B2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextMilestoneCard}
                    >
                        <Text style={styles.nextMilestoneEmoji}>{nextMilestone.emoji}</Text>
                        <View style={styles.nextMilestoneInfo}>
                            <Text style={styles.nextMilestoneLabel}>{t('levelScreen.nextMilestone')}</Text>
                            <Text style={styles.nextMilestoneTitle}>{t(nextMilestone.titleKey)}</Text>
                        </View>
                        <View style={styles.nextMilestoneRight}>
                            <Text style={styles.nextMilestoneLvl}>
                                {t('levelScreen.levelFull', { level: nextMilestone.level })}
                            </Text>
                            <Text style={styles.nextMilestoneJaap}>
                                {t('levelScreen.away', { num: jaapToNextMilestone.toLocaleString() })}
                            </Text>
                        </View>
                    </LinearGradient>
                )}
            </ScrollView>

            {/* ─── Level-Up Celebration Modal ──────────────────────────────── */}
            <Modal visible={showLevelUp} transparent animationType="fade" statusBarTranslucent>
                <View style={styles.modalOverlay}>
                    <Animated.View style={[
                        styles.levelUpCard,
                        { transform: [{ scale: celebScaleAnim }], opacity: celebOpacAnim },
                    ]}>
                        <LinearGradient
                            colors={['#FFD54F', '#F89626', '#E65100']}
                            style={styles.levelUpGradient}
                            start={{ x: 0.1, y: 0 }}
                            end={{ x: 0.9, y: 1 }}
                        >
                            <Text style={styles.celebSparkles}>✨  🎉  ✨</Text>
                            <Text style={styles.celebTitle}>{t('levelScreen.levelUp')}</Text>

                            {/* Bouncing SVG level number */}
                            <Animated.View style={{ transform: [{ scale: celebBounceAnim }] }}>
                                <Svg height={96} width={140} viewBox="0 0 140 96">
                                    <SvgText
                                        fill="#FFF9E6"
                                        stroke="rgba(255,255,255,0.35)"
                                        strokeWidth="5"
                                        fontSize={78}
                                        fontFamily="Poppins_700Bold"
                                        x={70}
                                        y={82}
                                        textAnchor="middle"
                                    >
                                        {levelUpLevel}
                                    </SvgText>
                                </Svg>
                            </Animated.View>

                            <Text style={styles.celebSubtitle}>
                                {t('levelScreen.youReached')}{'\n'}
                                <Text style={styles.celebBold}>
                                    {t(
                                        MILESTONES.filter(m => levelUpLevel >= m.level).slice(-1)[0]?.titleKey
                                        ?? 'levelScreen.milestoneNames.beginner'
                                    )}
                                </Text>
                                !{'\n'}{t('levelScreen.devotionGrows')} 🙏
                            </Text>

                            <Button
                                title={t('levelScreen.continue')}
                                variant="primary"
                                fullWidth
                                onPress={() => {
                                    hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Medium);
                                    setShowLevelUp(false);
                                }}
                            />
                        </LinearGradient>
                    </Animated.View>
                </View>
            </Modal>

            {/* ─── Milestone Info Modal ────────────────────────────────────── */}
            <Modal visible={!!selectedMilestone} transparent animationType="fade" statusBarTranslucent>
                <View style={styles.modalOverlay}>
                    {selectedMilestone && (
                        <View style={styles.infoModalCard}>
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 12, right: 12, padding: 8, zIndex: 10 }}
                                onPress={() => {
                                    hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                    setSelectedMilestone(null);
                                }}
                            >
                                <Ionicons name="close" size={24} color="#9E9E9E" />
                            </TouchableOpacity>

                            {currentLevel >= selectedMilestone.level ? (
                                // ─── COMPLETED / ACHIEVED LEVEL POPUP ───
                                <>
                                    <View style={styles.completedBadgeBox}>
                                        <View style={styles.completedEmojiCircle}>
                                            <Text style={styles.completedEmojiTxt}>{selectedMilestone.emoji}</Text>
                                        </View>
                                        <View style={styles.completedStarsRow}>
                                            <Ionicons name="star" size={18} color="#FFDF00" style={styles.cStarSide} />
                                            <Ionicons name="star" size={26} color="#FFD700" style={styles.cStarCenter} />
                                            <Ionicons name="star" size={18} color="#FFDF00" style={styles.cStarSide} />
                                        </View>
                                    </View>

                                    <Text style={styles.completedLevelText}>
                                        {t('levelScreen.levelFull', { level: selectedMilestone.level }).toUpperCase()} COMPLETED
                                    </Text>
                                    
                                    <Text style={styles.infoModalTitle}>
                                        {t(selectedMilestone.titleKey)}
                                    </Text>

                                    <View style={styles.completedStatsBox}>
                                        <Text style={styles.completedStatsLabel}>Total Jaap Dedicated</Text>
                                        <Text style={styles.completedStatsValue}>{(selectedMilestone.level * JAAP_PER_LEVEL).toLocaleString()}</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.completedButton}
                                        onPress={handleLetsJaapTransition}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#FFB74D', '#F89626', '#E65100']}
                                            style={styles.completedButtonGradient}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.completedButtonText}>Go to Next Level</Text>
                                            <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 4 }} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                // ─── CURRENT OR LOCKED POPUP ───
                                <>
                                    <View style={styles.infoModalEmojiBg}>
                                        <Text style={styles.infoModalEmoji}>{selectedMilestone.emoji}</Text>
                                    </View>

                                    <Text style={styles.infoModalLevel}>
                                        {t('levelScreen.levelFull', { level: selectedMilestone.level }).toUpperCase()}
                                    </Text>

                                    <Text style={styles.infoModalTitle}>
                                        {t(selectedMilestone.titleKey)}
                                    </Text>

                                    <Text style={styles.infoModalDesc}>
                                        {t(`levelScreen.milestoneDesc.${selectedMilestone.titleKey.split('.').pop()}`)}
                                    </Text>

                                    <View style={[
                                        styles.infoModalStatusBox,
                                        styles.infoModalStatusBoxLocked
                                    ]}>
                                        <Text style={[styles.infoModalStatusText, styles.infoModalStatusTextLocked]}>
                                            <Ionicons name="lock-closed" size={12} color="#757575" />{' '}
                                            {t('levelScreen.modalLocked')}
                                        </Text>
                                        <Text style={styles.infoModalSubStatusText}>
                                            {(selectedMilestone.level * JAAP_PER_LEVEL - totalBeads).toLocaleString()} {t('levelScreen.toGo')}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.infoModalButton}
                                        onPress={handleLetsJaapTransition}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.infoModalButtonText}>{t('levelScreen.modalGotIt')}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}
                </View>
            </Modal>

            {/* ─── All Activity History Modal ────────────────────────────────── */}
            <Modal visible={showHistoryModal} transparent animationType="slide" statusBarTranslucent>
                <View style={styles.historyModalOverlay}>
                    <View style={[styles.historyModalHeader, { paddingTop: insets.top + 16 }]}>
                        <Text style={styles.historyModalTitle}>{t('levelScreen.activityHistory')}</Text>
                        <TouchableOpacity style={styles.historyModalClose} onPress={() => setShowHistoryModal(false)}>
                            <Ionicons name="close" size={24} color="#9E9E9E" />
                        </TouchableOpacity>
                    </View>

                    {groupedHistoryItems.sections.length === 0 ? (
                        <Text style={styles.emptyHistoryText}>{t('levelScreen.noHistoryYet')}</Text>
                    ) : (
                        <SectionList
                            sections={groupedHistoryItems.sections}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.historyModalContent}
                            showsVerticalScrollIndicator={false}
                            renderSectionHeader={({ section: { title } }) => (
                                <View style={styles.historySectionHeader}>
                                    <Text style={styles.historySectionTitle}>{title}</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View style={styles.sessionCard}>
                                    <View style={styles.sessionLeft}>
                                        <View style={styles.sessionIconBox}>
                                            <Text style={styles.sessionIconEmoji}>📿</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.sessionBeads}>
                                                {item.totalBeads.toLocaleString()} {t('levelScreen.beads')}
                                            </Text>
                                            <Text style={styles.sessionSubtitle}>
                                                {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.sessionRoundsBadge}>
                                        <Text style={styles.sessionRounds}>
                                            {item.rounds} {t('levelScreen.rounds')}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>

            {/* ─── Let's Jaap Transient Popup ─── */}
            <Modal visible={showLetsJaap} transparent animationType="fade" statusBarTranslucent>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
                    <Animated.View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 80, marginBottom: 20 }}>📿</Text>
                        <Text style={{
                            fontFamily: 'Poppins_700Bold',
                            fontSize: 40,
                            color: '#FFF',
                            textShadowColor: 'rgba(248,150,38,0.8)',
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 15,
                        }}>
                            Let's Jaap!
                        </Text>
                    </Animated.View>
                </View>
            </Modal>

            <LevelMapOverlay 
                visible={showMap} 
                onClose={() => setShowMap(false)} 
                currentLevel={currentLevel}
                progressFrac={progressFrac}
                getMilestoneForLevel={getMilestoneForLevel}
                onSelectMilestone={(level) => {
                    const ms = getMilestoneForLevel(level);
                    setSelectedMilestone({ ...ms, level: level });
                }}
            />
        </View>
    );
};

