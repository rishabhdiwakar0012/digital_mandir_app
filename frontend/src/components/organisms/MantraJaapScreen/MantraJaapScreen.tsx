
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Platform,
    Image,
    Modal,
    Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as hapticUtils from '../../../utils/hapticUtils';
import { useTranslation } from 'react-i18next';
import { Mala } from './components/Mala';
import { useColors, Assets } from '../../../theme';
import ClickIcon from '../../../../assets/click.svg';
import { preloadMalaSound, playMalaSound, pauseMalaSound, unloadMalaSound } from './utils/malaSound';

import { HeaderLogo } from '../../molecules';
const { width, height: WIN_H } = Dimensions.get('window');
const isSmallDevice = width < 380;
const isLargeDevice = width >= 400;

// Estimated header height (status bar handled via insets + ~56px header + ~20px padding)
const APPROX_HEADER_H = 76;
// Use more of the screen height for the mala — it takes up ~80% of the flex area
const INITIAL_MALA_HEIGHT = WIN_H * 0.80 - APPROX_HEADER_H;

interface MantraJaapScreenProps {
    onBack: () => void;
    onComplete?: (durationSeconds: number) => void;
    mantraText?: string;
    targetCount?: number;
    audioUrl?: string;
}

const DEFAULT_MANTRA_TEXT = `" ॐ 'हनुमते नमः "`;

const DEFAULT_TARGET_COUNT = 108;

/** Format seconds to MM:SS string */
const formatTime = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const MantraJaapScreen: React.FC<MantraJaapScreenProps> = ({ onBack, onComplete, mantraText, targetCount = DEFAULT_TARGET_COUNT, audioUrl }) => {
    const insets = useSafeAreaInsets();
    const colors = useColors();
    const { t } = useTranslation();
    const [count, setCount] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [round, setRound] = useState(1);
    const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const startTimeRef = useRef(Date.now());
    const mountedRef = useRef(true);
    // Tracks whether the user has started the jaap (first bead tap) — used to start audio
    const soundStartedRef = useRef(false);
    // Pre-initialize with screen dimensions so the Mala renders on the very first
    // frame — onLayout will refine to exact values after the first layout pass.
    const [malaAreaSize, setMalaAreaSize] = useState({
        width,
        height: INITIAL_MALA_HEIGHT,
    });

    // Vibration toggle is LOCAL to this session only.
    // It starts ON every time the Jaap screen opens and does NOT persist —
    // so toggling it here never affects haptics on any other screen.


    // Preload mantra audio on mount (silent — plays on first tap), unload on unmount
    useEffect(() => {
        mountedRef.current = true;
        // Just preload — do NOT auto-play. Sound starts on first mala tap.
        preloadMalaSound(audioUrl);
        return () => {
            mountedRef.current = false;
            soundStartedRef.current = false;
            // Always stop+release on unmount (back press, tab switch, completion)
            unloadMalaSound();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When jaap completes: stop sound immediately, then navigate
    useEffect(() => {
        if (isCompleted) {
            // Stop audio NOW — before the phase transition unmounts us
            pauseMalaSound();
            if (onComplete) {
                const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
                onComplete(durationSeconds);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompleted]);
    useEffect(() => {
        if (isCompleted) return;
        startTimeRef.current = Date.now();
        const interval = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isCompleted]);

    // When isCompleted becomes true, call onComplete is now handled in the isCompleted effect above

    const handleTap = () => {
        // Prevent taps after completion
        if (isCompleted) {
            return;
        }

        // Only fire haptic if the user has vibration enabled
        if (isVibrationEnabled) hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);

        // Start audio on the very first bead tap
        if (!soundStartedRef.current) {
            soundStartedRef.current = true;
            if (audioUrl && isSoundEnabled) {
                playMalaSound();
            }
        }

        if (!hasStarted) {
            setHasStarted(true);
        }
        
        setCount((prev) => {
            const newCount = prev + 1;
            // When we complete a full mala round based on exactly targetCount
            if (newCount > 0 && newCount % targetCount === 0) {
                setIsCompleted(true);
                setHasStarted(false);
                setRound((r) => r + 1);
                // Do NOT call onComplete or stop sounds here; useEffect will handle it
            }
            return newCount;
        });
    };

    const handleReset = () => {
        if (isVibrationEnabled) hapticUtils.notificationAsync(hapticUtils.NotificationFeedbackType.Warning);
        setCount(0);
        setRound(1);
        setElapsedSeconds(0);
        setHasStarted(false);
        startTimeRef.current = Date.now();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <View style={styles.headerTitleContainer}>
                    <HeaderLogo />
                </View>
            </View>

            {/* Top Right Decorative Icon */}
            <Image
                source={Assets.cardBackground}
                style={{
                    position: 'absolute',
                    top: -60,
                    right: -100,
                    width: 200,
                    height: 200,
                    tintColor: '#D4AF37',
                    opacity: 0.25,
                    transform: [{ rotate: '0deg' }],
                    zIndex: 0,
                }}
                resizeMode="contain"
            />

            {/* Bottom Left Decorative Icon */}
            <Image
                source={Assets.cardBackground}
                style={{
                    position: 'absolute',
                    bottom: -100,
                    left: -100,
                    width: 200,
                    height: 200,
                    tintColor: '#D4AF37',
                    opacity: 0.25,
                    transform: [{ rotate: '0deg' }],
                    zIndex: 0,
                }}
                resizeMode="contain"
            />

            {/* Main Content Area */}
            <View style={styles.mainContent}>

                {/* Mala Layer */}
                <View
                    style={styles.malaContainer}
                    onLayout={(e) => {
                        const { width, height } = e.nativeEvent.layout;
                        // Subtract horizontal padding (16 * 2) from available width
                        setMalaAreaSize({ width: width - 32, height });
                    }}
                >
                    <Mala
                        currentBeadIndex={count}
                        availableWidth={malaAreaSize.width}
                        availableHeight={malaAreaSize.height}
                        maxBeads={targetCount + 50}
                    />
                </View>

                {/* Center Dashboard Card */}
                <View style={styles.centerOverlay}>
                    <View style={styles.dashboardCard}>
                        {/* Card Header */}
                        <View style={styles.cardHeader}>
                            {/* Timer Section */}
                            <View style={styles.headerSection}>
                                <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
                                <Text style={styles.timerLabel}>{t('mantraJaapScreen.time')}</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            {/* Count Section: show full targetCount when completed so it never flashes 0 */}
                            <View style={styles.headerSection}>
                                <Text style={styles.countText}>{isCompleted ? targetCount : count % targetCount}</Text>
                                <Text style={styles.totalText}>of {targetCount}</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            {/* Reset Section */}
                            <TouchableOpacity style={styles.headerSection} onPress={handleReset}>
                                <Ionicons name="refresh" size={isSmallDevice ? 22 : 28} color="#585858" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.horizontalDivider} />

                        {/* Card Body - Mantra */}
                        <View style={styles.cardBody}>
                            <Text style={styles.mantraText} numberOfLines={3} adjustsFontSizeToFit>{mantraText || DEFAULT_MANTRA_TEXT}</Text>
                        </View>
                    </View>
                </View>

                {/* Direct-Action Controls */}
                <View style={styles.controlsRow}>
                    <View style={styles.controlsContainer}>
                        {/* Sound toggle — always visible; disabled when no audio uploaded */}
                        <TouchableOpacity
                            onPress={() => {
                                if (!audioUrl) return;
                                const newEnabled = !isSoundEnabled;
                                setIsSoundEnabled(newEnabled);
                                if (isVibrationEnabled) hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                if (newEnabled) {
                                    // Resume only if user has already started tapping
                                    if (soundStartedRef.current) playMalaSound();
                                } else {
                                    pauseMalaSound();
                                }
                            }}
                            style={[styles.controlBtn, (!isSoundEnabled || !audioUrl) && styles.controlBtnMuted]}
                            activeOpacity={audioUrl ? 0.7 : 1}
                        >
                            <View style={{ position: 'relative', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons
                                    name="musical-notes"
                                    size={24}
                                    color={audioUrl && isSoundEnabled ? '#E65100' : '#AAA'}
                                />
                                {(!isSoundEnabled || !audioUrl) && (
                                    <View
                                        pointerEvents="none"
                                        style={{
                                            position: 'absolute',
                                            width: 28,
                                            height: 2,
                                            backgroundColor: '#E53935',
                                            borderRadius: 1,
                                            transform: [{ rotate: '-45deg' }],
                                        }}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                        {/* Settings */}
                        <TouchableOpacity
                            onPress={() => setShowSettingsModal(true)}
                            style={styles.controlBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="settings-sharp" size={24} color="#555" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Settings Modal */}
                <Modal
                    visible={showSettingsModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowSettingsModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowSettingsModal(false)}
                    >
                        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                            <Text style={styles.modalTitle}>{t('mantraJaapScreen.settings')}</Text>
                            <View style={styles.modalRow}>
                                <View style={styles.modalRowLeft}>
                                    <Ionicons name="phone-portrait-outline" size={20} color="#555" />
                                    <Text style={styles.modalRowLabel}>{t('mantraJaapScreen.vibration')}</Text>
                                </View>
                                <Switch
                                    value={isVibrationEnabled}
                                    onValueChange={(val) => {
                                        // Local session state only — does not persist to storage
                                        setIsVibrationEnabled(val);
                                    }}
                                    trackColor={{ false: '#D1D1D6', true: '#FFCC80' }}
                                    thumbColor={isVibrationEnabled ? '#FF9800' : '#f4f3f4'}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setShowSettingsModal(false)}
                            >
                                <Text style={styles.modalCloseBtnText}>{t('common.done')}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>


                {/* Tap Button */}
                <View style={styles.tapButtonContainer}>
                    <TouchableOpacity
                        style={[styles.tapButton, isCompleted && styles.tapButtonDisabled]}
                        onPress={handleTap}
                        activeOpacity={isCompleted ? 1 : 0.7}
                        disabled={isCompleted}
                    >
                        <View style={styles.tapInnerCircle}>
                            <ClickIcon width={40} height={40} />
                        </View>
                    </TouchableOpacity>
                </View>

            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFF8F0',
    },
    backButton: {
        padding: 8,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        marginRight: 40,
    },
    headerTitleBlock: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    malaContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    centerOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
        top: '25%',
    },
    dashboardCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: isSmallDevice ? '70%' : (isLargeDevice ? '75%' : '80%'),
        maxWidth: isSmallDevice ? 210 : (isLargeDevice ? 260 : 300),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderTopWidth: 3,
        borderTopColor: '#FFCC80',
    },
    cardHeader: {
        flexDirection: 'row',
        height: isSmallDevice ? 44 : 56,
        alignItems: 'center',
    },
    headerSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    verticalDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#E0E0E0',
    },
    horizontalDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    timerText: {
        fontSize: isSmallDevice ? 13 : 17,
        fontWeight: 'bold',
        color: '#555',
        letterSpacing: 0.5,
    },
    timerLabel: {
        fontSize: isSmallDevice ? 8 : 10,
        color: '#999',
        marginTop: 1,
    },
    countText: {
        fontSize: isSmallDevice ? 16 : 28,
        fontWeight: 'bold',
        color: '#222',
        lineHeight: isSmallDevice ? 20 : 32,
    },
    totalText: {
        fontSize: isSmallDevice ? 8 : 12,
        color: '#999',
        fontWeight: '500',
    },
    cardBody: {
        paddingVertical: isSmallDevice ? 12 : (isLargeDevice ? 16 : 22),
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mantraText: {
        fontSize: isSmallDevice ? 16 : (isLargeDevice ? 20 : 26),
        fontWeight: '500',
        color: '#222',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    controlsRow: {
        position: 'absolute',
        top: '52%',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    controlBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
    },
    controlBtnMuted: {
        backgroundColor: '#F5F5F5',
        elevation: 1,
        shadowOpacity: 0.05,
    },
    // Settings Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 28,
        width: '75%',
        maxWidth: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    modalRowLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    modalCloseBtn: {
        marginTop: 20,
        alignSelf: 'center',
        backgroundColor: '#FF9800',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 32,
    },
    modalCloseBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    tapButtonContainer: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tapButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF8E1',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFE082',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tapInnerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    tapButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#C0BCC4',
        borderColor: '#B0ADB1',
    },
});
