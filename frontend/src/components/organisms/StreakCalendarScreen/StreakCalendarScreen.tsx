import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Image, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import * as hapticUtils from '../../../utils/hapticUtils';
import { styles } from './styles';
import { jaapApi, UserStats } from '../../../api/services/jaapApi';
import { useAppStore } from '../../../store/appStore';
import { getQueue } from '../../../utils/offlineMutationQueue';
import { useTranslation } from 'react-i18next';
import { Button } from '../../atoms/Button';

const MONTH_NAMES_KEYS = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

interface StreakCalendarScreenProps {
    onBack: () => void;
    onContinue: () => void;
    isFromJaapCompletion?: boolean;
    onAnotherJaap?: () => void;
    onCancel?: () => void;
}

export const StreakCalendarScreen: React.FC<StreakCalendarScreenProps> = ({ onBack, onContinue, isFromJaapCompletion, onAnotherJaap, onCancel }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
    const [statsData, setStatsData] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [showLetsJaap, setShowLetsJaap] = useState(false);
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const isOnline = useAppStore((s) => s.isOnline);

    const handleAnotherJaap = () => {
        hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Medium);
        setShowLetsJaap(true);
        setTimeout(() => {
            setShowLetsJaap(false);
            if (onAnotherJaap) onAnotherJaap();
        }, 1500);
    };

    /** Build today's date string in local timezone */
    const getTodayStr = () => {
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const loadData = async () => {
        setLoading(true);
        setLoadError(false);
        try {
            // ── Try to load from server first ────────────────────────────────
            let stats: UserStats | null = null;
            let sessionItems: any[] = [];
            let apiSuccess = false;

            if (isOnline) {
                try {
                    const [serverStats, history] = await Promise.all([
                        jaapApi.getMyStats(),
                        jaapApi.getSessions(1, 500),
                    ]);
                    stats = serverStats;
                    sessionItems = history?.items ?? [];
                    apiSuccess = true;
                    // Persist fresh data into React Query cache so offline fallback is warm
                    queryClient.setQueryData<UserStats>(['userStats'], serverStats);
                } catch {
                    // Network blip while technically "online" — fall through to cache
                }
            }

            // ── Offline (or API failed): read from React Query cache ──────────
            if (!apiSuccess) {
                stats = queryClient.getQueryData<UserStats>(['userStats']) ?? null;
                // Sessions cache (may not exist — that's OK, we inject today below)
                const cachedSessions = queryClient.getQueryData<{ items: any[] }>(['userSessions', 1, 50]);
                sessionItems = cachedSessions?.items ?? [];
            }

            if (stats) {
                setStatsData(stats);
            }

            // ── Build active date set from session history ────────────────────
            const dates = new Set<string>();

            sessionItems.forEach((session: any) => {
                // Use LOCAL date (not UTC) to avoid timezone shift issues
                const d = new Date(session.completedAt);
                const y = d.getFullYear();
                const mo = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dates.add(`${y}-${mo}-${day}`);
            });

            // ── Always mark today if jaap was just completed ──────────────────
            // (covers both online save and offline queue — the session exists)
            if (isFromJaapCompletion) {
                dates.add(getTodayStr());
            }

            // ── Also mark today if there are any pending offline sessions ─────
            // (handles the case where user opens streak tab directly while offline)
            try {
                const queue = await getQueue();
                if (queue.length > 0) {
                    dates.add(getTodayStr());
                }
            } catch {
                // best-effort — ignore
            }

            setActiveDates(dates);

            // Only show error when:
            // - No data whatsoever (not from cache, not from API)
            // - AND not from a jaap completion (we always know today happened)
            if (!stats && !apiSuccess && !isFromJaapCompletion) {
                setLoadError(true);
            }

            // If still no stats but we're from jaap completion, build a minimal baseline
            // so the stats card shows something reasonable rather than all zeros.
            if (!stats && isFromJaapCompletion) {
                setStatsData({
                    totalCoins: 0,
                    totalJaapSessions: 1,
                    totalBeads: 0,
                    totalRounds: 1,
                    streak: 1,
                    lastStreakUpdateAt: new Date().toISOString(),
                });
            }
        } catch (e) {
            console.error('Failed to load streak data', e);
            // Last resort: try cache
            const cachedStats = queryClient.getQueryData<UserStats>(['userStats']);
            if (cachedStats) {
                setStatsData(cachedStats);
                if (isFromJaapCompletion) {
                    setActiveDates(new Set([getTodayStr()]));
                }
            } else if (isFromJaapCompletion) {
                // Even with no cache, show a minimal result — session definitely happened
                setStatsData({
                    totalCoins: 0,
                    totalJaapSessions: 1,
                    totalBeads: 0,
                    totalRounds: 1,
                    streak: 1,
                    lastStreakUpdateAt: new Date().toISOString(),
                });
                setActiveDates(new Set([getTodayStr()]));
            } else {
                setLoadError(true);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
        setCurrentDate(newDate);
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

    // Grid generation
    const gridCells = [];
    for (let i = 0; i < firstDayOfMonth; i++) gridCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) gridCells.push(d);

    const isDayActive = (day: number) => {
        const m = (month + 1).toString().padStart(2, '0');
        const d = day.toString().padStart(2, '0');
        const key = `${year}-${m}-${d}`;
        return activeDates.has(key);
    };

    const isToday = (day: number) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isFuture = (day: number) => {
        const d = new Date(year, month, day);
        d.setHours(0, 0, 0, 0);
        const t = new Date(today);
        t.setHours(0, 0, 0, 0);
        return d.getTime() > t.getTime();
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFFFFF', '#FFF7E6', '#FFE4A0']} // Premium soft gold sunrise gradient
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                {/* Main Content */}
                <View style={styles.contentContent}>
                    <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                            <View style={styles.titleRightPlaceholder} />
                            <Text style={styles.title}>{t('streakCalendarScreen.title')}</Text>
                            <View style={styles.titleRightPlaceholder} />
                        </View>
                        <Text style={styles.subtitle}>{t('streakCalendarScreen.subtitle')}</Text>
                    </View>

                    {/* Stats Summary Card */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Ionicons name="flame" size={28} color="#FF8C00" />
                            <Text style={styles.statValue}>{isFromJaapCompletion ? Math.max(statsData?.streak || 0, 1) : (statsData?.streak || 0)}</Text>
                            <Text style={styles.statLabel}>{t('streakCalendarScreen.dayStreak')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="medal" size={28} color="#FF8C00" />
                            <Text style={styles.statValue}>{statsData?.totalJaapSessions || 0}</Text>
                            <Text style={styles.statLabel}>{t('streakCalendarScreen.sessions')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            {/* Reusing coin icon styling idea from StreakScreen */}
                            <Image source={require('../../../../assets/coin.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                            <Text style={styles.statValue}>{statsData?.totalCoins || 0}</Text>
                            <Text style={styles.statLabel}>{t('streakCalendarScreen.coins')}</Text>
                        </View>
                    </View>

                    {/* Calendar Component */}
                    <View style={styles.calendarCard}>
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                                <Ionicons name="chevron-back" size={20} color="#555" />
                            </TouchableOpacity>
                            <Text style={styles.monthText}>{t(`streakCalendarScreen.months.${MONTH_NAMES_KEYS[month]}` as any)} {year}</Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                                <Ionicons name="chevron-forward" size={20} color="#555" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.daysHeaderRow}>
                            {(t('streakCalendarScreen.days', { returnObjects: true }) as string[]).map((d, i) => (
                                <Text key={i} style={styles.dayHeaderCell}>{d}</Text>
                            ))}
                        </View>

                        <View style={styles.grid}>
                            {loading ? (
                                <View style={{ height: 200, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityIndicator size="large" color="#F89626" />
                                </View>
                            ) : loadError ? (
                                <View style={{ height: 200, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                    <Text style={{ color: '#888', fontFamily: 'Poppins_400Regular' }}>Failed to load data</Text>
                                    <TouchableOpacity onPress={loadData} style={{ backgroundColor: '#F89626', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 }}>
                                        <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                gridCells.map((day, index) => {
                                    if (day === null) {
                                        return <View key={`empty-${index}`} style={styles.dayCell} />;
                                    }

                                    const active = isDayActive(day);
                                    const todayFlag = isToday(day);

                                    return (
                                        <View key={`day-${day}`} style={styles.dayCell}>
                                            {active ? (
                                                <LinearGradient
                                                    colors={['#FCA311', '#FF8C00']}
                                                    style={styles.checkedCircle}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                >
                                                    <Ionicons name="flame" size={14} color="#FFFFFF" />
                                                    <Text style={styles.activeDayText}>{day}</Text>
                                                </LinearGradient>
                                            ) : (
                                                <View style={[styles.emptyCircle, todayFlag && styles.todayCircle]}>
                                                    <Text style={[styles.dayText, todayFlag && styles.todayText]}>{day}</Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>
                </View>

                {isFromJaapCompletion && onAnotherJaap && (
                    <View style={styles.footer}>
                        <Button
                            title={t('streakCalendarScreen.anotherJaap')}
                            variant="primary"
                            fullWidth
                            onPress={handleAnotherJaap}
                        />
                        
                        {onCancel && (
                            <TouchableOpacity
                                style={{ marginTop: 8, paddingVertical: 8, alignItems: 'center' }}
                                onPress={() => {
                                    hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                    onCancel();
                                }}
                            >
                                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#9E9E9E' }}>
                                    {t('navigation.home', 'Home')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

            </SafeAreaView>

            {/* ─── Let's Jaap Transient Popup ─── */}
            <Modal visible={showLetsJaap} transparent animationType="fade" statusBarTranslucent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
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
        </View>
    );
};
