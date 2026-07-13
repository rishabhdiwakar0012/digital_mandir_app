import React, { useRef, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, Modal, ScrollView,
    Animated, TouchableOpacity, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import * as hapticUtils from '../../../utils/hapticUtils';

// ─── Assets ──────────────────────────────────────────────────────────────────
const DEITY_IMAGES = [
    require('../../../../assets/load-ganesh.png'),
    require('../../../../assets/load-hanuman.png'),
    require('../../../../assets/load-shiv.png'),
    require('../../../../assets/load-shani.png'),
];
const COIN_IMG      = require('../../../../assets/coin.png');
const DIYA_IMG      = require('../../../../assets/main-diya.webp'); // Upgraded to rich realistic image
const RUDRAKSHA_IMG = require('../../../../assets/ten-mukhi-rudraksha.webp');

export interface MilestoneDef {
    level: number;
    titleKey: string;
    emoji: string;
}

interface LevelMapOverlayProps {
    visible: boolean;
    onClose: () => void;
    currentLevel: number;
    progressFrac: number;
    getMilestoneForLevel: (lvl: number) => MilestoneDef;
    onSelectMilestone: (lvl: number) => void;
}

const { width, height: SCREEN_H } = Dimensions.get('window');

// ─── Layout constants ─────────────────────────────────────────────────────────
const ITEM_HEIGHT = 120;           // vertical distance between node centers
const NODE_SIZE = 52;            // regular node diameter
const BIG_NODE = 64;            // milestone & gift node diameter
const ROAD_OUTER = 20;            // road outer edge stroke
const ROAD_INNER = 12;            // road inner fill stroke
const MILESTONE_LEVELS = new Set([5, 10, 20, 50, 100]);

// ─── Spiritual background decorations ────────────────────────────────────────
// Grid columns (no overlap guaranteed):
//   Outer-left  xFrac=0.01  y: 0.04, 0.11 … (7% steps)
//   Inner-left  xFrac=0.16  y: 0.075, 0.145… (7% steps, offset 3.5%)  ← NEW
//   Outer-right xFrac=0.84  y: 0.07, 0.14 … (7% steps, offset 3.5%)
//   Inner-right xFrac=0.72  y: 0.035, 0.105… (7% steps, offset 0%)    ← NEW
//   OM marks    xFrac=0.10/0.60 every 20%
//   Sparkles    xFrac 0.36-0.50 every 10%
type DecoItem = { type: string; xFrac: number; yFrac: number; opacity: number; rotate: number; };
const SPIRITUAL_DECOS: DecoItem[] = [
    // ── OUTER-LEFT COLUMN (xFrac=0.01, y every 7%) ───────────────────────────
    { type: 'diya',      xFrac: 0.01, yFrac: 0.04, opacity: 0.55, rotate: -10 },
    { type: 'flower',     xFrac: 0.01, yFrac: 0.11, opacity: 0.50, rotate:   5 },
    { type: 'coin',      xFrac: 0.01, yFrac: 0.18, opacity: 0.55, rotate: -15 },
    { type: 'rudraksha', xFrac: 0.01, yFrac: 0.25, opacity: 0.50, rotate:  20 },
    { type: 'flower',    xFrac: 0.01, yFrac: 0.32, opacity: 0.45, rotate:  12 },
    { type: 'mala',      xFrac: 0.01, yFrac: 0.39, opacity: 0.42, rotate:  -8 },
    { type: 'diya',      xFrac: 0.01, yFrac: 0.46, opacity: 0.55, rotate:  -6 },
    { type: 'flower',     xFrac: 0.01, yFrac: 0.53, opacity: 0.50, rotate:   8 },
    { type: 'coin',      xFrac: 0.01, yFrac: 0.60, opacity: 0.55, rotate: -18 },
    { type: 'rudraksha', xFrac: 0.01, yFrac: 0.67, opacity: 0.50, rotate:  15 },
    { type: 'flower',    xFrac: 0.01, yFrac: 0.74, opacity: 0.45, rotate: -12 },
    { type: 'diya',      xFrac: 0.01, yFrac: 0.81, opacity: 0.52, rotate:  10 },
    { type: 'flower',     xFrac: 0.01, yFrac: 0.88, opacity: 0.50, rotate:  -5 },
    { type: 'coin',      xFrac: 0.01, yFrac: 0.95, opacity: 0.52, rotate:  22 },

    // ── INNER-LEFT COLUMN (xFrac=0.16, emoji-only, y offset +3.5%) ───────────
    { type: 'flower',  xFrac: 0.16, yFrac: 0.075, opacity: 0.35, rotate:   8 },
    { type: 'sparkle', xFrac: 0.16, yFrac: 0.145, opacity: 0.32, rotate: -20 },
    { type: 'mala',    xFrac: 0.16, yFrac: 0.215, opacity: 0.35, rotate:  15 },
    { type: 'flower',  xFrac: 0.16, yFrac: 0.285, opacity: 0.32, rotate: -10 },
    { type: 'sparkle', xFrac: 0.16, yFrac: 0.355, opacity: 0.35, rotate:  25 },
    { type: 'mala',    xFrac: 0.16, yFrac: 0.425, opacity: 0.32, rotate:  -5 },
    { type: 'flower',  xFrac: 0.16, yFrac: 0.495, opacity: 0.35, rotate:  18 },
    { type: 'sparkle', xFrac: 0.16, yFrac: 0.565, opacity: 0.32, rotate: -15 },
    { type: 'mala',    xFrac: 0.16, yFrac: 0.635, opacity: 0.35, rotate:  12 },
    { type: 'flower',  xFrac: 0.16, yFrac: 0.705, opacity: 0.32, rotate: -22 },
    { type: 'sparkle', xFrac: 0.16, yFrac: 0.775, opacity: 0.35, rotate:   6 },
    { type: 'mala',    xFrac: 0.16, yFrac: 0.845, opacity: 0.32, rotate: -18 },
    { type: 'flower',  xFrac: 0.16, yFrac: 0.915, opacity: 0.35, rotate:  10 },
    { type: 'sparkle', xFrac: 0.16, yFrac: 0.985, opacity: 0.32, rotate: -12 },

    // ── OUTER-RIGHT COLUMN (xFrac=0.84, y every 7%, offset 3.5%) ─────────────
    { type: 'coin',      xFrac: 0.84, yFrac: 0.07, opacity: 0.55, rotate:  18 },
    { type: 'rudraksha', xFrac: 0.84, yFrac: 0.14, opacity: 0.50, rotate: -15 },
    { type: 'flower',     xFrac: 0.84, yFrac: 0.21, opacity: 0.50, rotate:   5 },
    { type: 'diya',      xFrac: 0.84, yFrac: 0.28, opacity: 0.55, rotate:  14 },
    { type: 'mala',      xFrac: 0.84, yFrac: 0.35, opacity: 0.42, rotate: -20 },
    { type: 'flower',    xFrac: 0.84, yFrac: 0.42, opacity: 0.45, rotate:   8 },
    { type: 'coin',      xFrac: 0.84, yFrac: 0.49, opacity: 0.55, rotate: -10 },
    { type: 'diya',      xFrac: 0.84, yFrac: 0.56, opacity: 0.52, rotate:  12 },
    { type: 'flower',     xFrac: 0.84, yFrac: 0.63, opacity: 0.50, rotate:  -8 },
    { type: 'rudraksha', xFrac: 0.84, yFrac: 0.70, opacity: 0.50, rotate:  20 },
    { type: 'flower',    xFrac: 0.84, yFrac: 0.77, opacity: 0.45, rotate: -15 },
    { type: 'diya',      xFrac: 0.84, yFrac: 0.84, opacity: 0.52, rotate:   8 },
    { type: 'coin',      xFrac: 0.84, yFrac: 0.91, opacity: 0.55, rotate: -22 },
    { type: 'flower',     xFrac: 0.84, yFrac: 0.98, opacity: 0.50, rotate:   6 },

    // ── INNER-RIGHT COLUMN (xFrac=0.72, emoji-only, y offset 0%) ─────────────
    { type: 'sparkle', xFrac: 0.72, yFrac: 0.035, opacity: 0.32, rotate:  20 },
    { type: 'flower',  xFrac: 0.72, yFrac: 0.105, opacity: 0.35, rotate: -15 },
    { type: 'mala',    xFrac: 0.72, yFrac: 0.175, opacity: 0.32, rotate:  10 },
    { type: 'sparkle', xFrac: 0.72, yFrac: 0.245, opacity: 0.35, rotate: -25 },
    { type: 'flower',  xFrac: 0.72, yFrac: 0.315, opacity: 0.32, rotate:  18 },
    { type: 'mala',    xFrac: 0.72, yFrac: 0.385, opacity: 0.35, rotate:  -8 },
    { type: 'sparkle', xFrac: 0.72, yFrac: 0.455, opacity: 0.32, rotate:  30 },
    { type: 'flower',  xFrac: 0.72, yFrac: 0.525, opacity: 0.35, rotate: -12 },
    { type: 'mala',    xFrac: 0.72, yFrac: 0.595, opacity: 0.32, rotate:  22 },
    { type: 'sparkle', xFrac: 0.72, yFrac: 0.665, opacity: 0.35, rotate:  -5 },
    { type: 'flower',  xFrac: 0.72, yFrac: 0.735, opacity: 0.32, rotate:  16 },
    { type: 'mala',    xFrac: 0.72, yFrac: 0.805, opacity: 0.35, rotate: -20 },
    { type: 'sparkle', xFrac: 0.72, yFrac: 0.875, opacity: 0.32, rotate:   8 },
    { type: 'flower',  xFrac: 0.72, yFrac: 0.945, opacity: 0.35, rotate: -14 },

    // ── CENTER-LEFT OM watermarks (xFrac=0.10, every 20%) ────────────────────
    { type: 'om', xFrac: 0.10, yFrac: 0.10, opacity: 0.18, rotate:  -5 },
    { type: 'om', xFrac: 0.10, yFrac: 0.30, opacity: 0.16, rotate:   8 },
    { type: 'om', xFrac: 0.10, yFrac: 0.50, opacity: 0.18, rotate:  -6 },
    { type: 'om', xFrac: 0.10, yFrac: 0.70, opacity: 0.16, rotate:   7 },
    { type: 'om', xFrac: 0.10, yFrac: 0.90, opacity: 0.18, rotate:  -4 },

    // ── CENTER-RIGHT OM watermarks (xFrac=0.60, offset by 10%) ───────────────
    { type: 'om', xFrac: 0.60, yFrac: 0.20, opacity: 0.15, rotate:  10 },
    { type: 'om', xFrac: 0.60, yFrac: 0.40, opacity: 0.17, rotate:  -8 },
    { type: 'om', xFrac: 0.60, yFrac: 0.60, opacity: 0.15, rotate:   6 },
    { type: 'om', xFrac: 0.60, yFrac: 0.80, opacity: 0.17, rotate: -10 },

    // ── SPARKLES in center gaps (xFrac 0.36-0.50, every 10%) ─────────────────
    { type: 'sparkle', xFrac: 0.42, yFrac: 0.05, opacity: 0.35, rotate:   0 },
    { type: 'sparkle', xFrac: 0.36, yFrac: 0.15, opacity: 0.32, rotate:  30 },
    { type: 'sparkle', xFrac: 0.48, yFrac: 0.25, opacity: 0.35, rotate: -20 },
    { type: 'sparkle', xFrac: 0.38, yFrac: 0.35, opacity: 0.32, rotate:  15 },
    { type: 'sparkle', xFrac: 0.46, yFrac: 0.45, opacity: 0.35, rotate: -30 },
    { type: 'sparkle', xFrac: 0.36, yFrac: 0.55, opacity: 0.32, rotate:  25 },
    { type: 'sparkle', xFrac: 0.44, yFrac: 0.65, opacity: 0.35, rotate: -15 },
    { type: 'sparkle', xFrac: 0.40, yFrac: 0.75, opacity: 0.32, rotate:  20 },
    { type: 'sparkle', xFrac: 0.50, yFrac: 0.85, opacity: 0.35, rotate: -25 },
    { type: 'sparkle', xFrac: 0.36, yFrac: 0.95, opacity: 0.32, rotate:  10 },

    // ── CENTER-LEFT IMAGE COLUMN (xFrac=0.25, real images, y offset 1%) ───────
    { type: 'coin',      xFrac: 0.25, yFrac: 0.02,  opacity: 0.32, rotate: -12 },
    { type: 'flower',     xFrac: 0.25, yFrac: 0.09,  opacity: 0.30, rotate:   8 },
    { type: 'rudraksha', xFrac: 0.25, yFrac: 0.16,  opacity: 0.32, rotate:  18 },
    { type: 'diya',      xFrac: 0.25, yFrac: 0.23,  opacity: 0.30, rotate:  -6 },
    { type: 'coin',      xFrac: 0.25, yFrac: 0.30,  opacity: 0.32, rotate:  22 },
    { type: 'flower',     xFrac: 0.25, yFrac: 0.37,  opacity: 0.30, rotate: -10 },
    { type: 'rudraksha', xFrac: 0.25, yFrac: 0.44,  opacity: 0.32, rotate:  14 },
    { type: 'diya',      xFrac: 0.25, yFrac: 0.51,  opacity: 0.30, rotate:  -8 },
    { type: 'coin',      xFrac: 0.25, yFrac: 0.58,  opacity: 0.32, rotate:  20 },
    { type: 'flower',     xFrac: 0.25, yFrac: 0.65,  opacity: 0.30, rotate:  -4 },
    { type: 'rudraksha', xFrac: 0.25, yFrac: 0.72,  opacity: 0.32, rotate:  16 },
    { type: 'diya',      xFrac: 0.25, yFrac: 0.79,  opacity: 0.30, rotate: -14 },
    { type: 'coin',      xFrac: 0.25, yFrac: 0.86,  opacity: 0.32, rotate:  10 },
    { type: 'flower',     xFrac: 0.25, yFrac: 0.93,  opacity: 0.30, rotate:  -18 },

    // ── CENTER-RIGHT IMAGE COLUMN (xFrac=0.55, real images, y offset 5.5%) ────
    { type: 'flower',    xFrac: 0.55, yFrac: 0.055, opacity: 0.30, rotate:   6 },
    { type: 'rudraksha', xFrac: 0.55, yFrac: 0.125, opacity: 0.32, rotate: -16 },
    { type: 'diya',      xFrac: 0.55, yFrac: 0.195, opacity: 0.30, rotate:  12 },
    { type: 'coin',      xFrac: 0.55, yFrac: 0.265, opacity: 0.32, rotate:  -8 },
    { type: 'flower',    xFrac: 0.55, yFrac: 0.335, opacity: 0.30, rotate:  20 },
    { type: 'rudraksha', xFrac: 0.55, yFrac: 0.405, opacity: 0.32, rotate: -12 },
    { type: 'diya',      xFrac: 0.55, yFrac: 0.475, opacity: 0.30, rotate:   6 },
    { type: 'coin',      xFrac: 0.55, yFrac: 0.545, opacity: 0.32, rotate: -22 },
    { type: 'flower',    xFrac: 0.55, yFrac: 0.615, opacity: 0.30, rotate:  14 },
    { type: 'rudraksha', xFrac: 0.55, yFrac: 0.685, opacity: 0.32, rotate:  -6 },
    { type: 'diya',      xFrac: 0.55, yFrac: 0.755, opacity: 0.30, rotate:  18 },
    { type: 'coin',      xFrac: 0.55, yFrac: 0.825, opacity: 0.32, rotate: -10 },
    { type: 'flower',    xFrac: 0.55, yFrac: 0.895, opacity: 0.30, rotate:   8 },
    { type: 'rudraksha', xFrac: 0.55, yFrac: 0.965, opacity: 0.32, rotate: -20 },
];

export const LevelMapOverlay: React.FC<LevelMapOverlayProps> = ({
    visible, onClose, currentLevel, progressFrac, getMilestoneForLevel, onSelectMilestone,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const maxLevelToShow = Math.max(100, currentLevel + 25);
    const levels = Array.from({ length: maxLevelToShow }, (_, i) => i + 1);

    const scrollRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

            setTimeout(() => {
                if (scrollRef.current) {
                    const idx = maxLevelToShow - currentLevel;
                    const yOff = idx * ITEM_HEIGHT - SCREEN_H / 2 + ITEM_HEIGHT / 2;
                    scrollRef.current.scrollTo({ y: Math.max(0, yOff), animated: false });
                }
            }, 120);
        } else {
            fadeAnim.setValue(0);
            pulseAnim.setValue(1);
            bounceAnim.setValue(0);
        }
    }, [visible, currentLevel, maxLevelToShow]);

    const reversedLevels = useMemo(() => [...levels].reverse(), [levels.length]);
    const totalHeight = reversedLevels.length * ITEM_HEIGHT;

    // Snaking X position — tighter wave for smaller layout
    const getXOffset = (level: number) => {
        const amp = width / 2 - 60;
        return width / 2 + Math.sin(level * 0.65) * amp;
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent statusBarTranslucent animationType="fade">
            <Animated.View style={[styles.root, { opacity: fadeAnim }]}>

                {/* ─── Background: light cream/yellow gradient ─── */}
                <LinearGradient
                    colors={['#FFFDF5', '#FFF8DC', '#FFF3C0', '#FFEEA0']}
                    locations={[0, 0.3, 0.65, 1]}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* ─── Decorative soft circle overlays ─── */}
                <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                    <View style={styles.decoCircleLeft} />
                    <View style={styles.decoCircleRight} />
                    <View style={styles.decoCircleBottomLeft} />
                </View>

                {/* ─── Scrollable map ─── */}
                <ScrollView
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        height: totalHeight + insets.top + 60,
                        paddingTop: insets.top + 90,
                    }}
                >
                    {/* ─── Spiritual background decorations ─── */}
                    {SPIRITUAL_DECOS.map((d, i) => {
                        // ─── Mathematical Collision Avoidance ───
                        // Calculate exact X-coordinate of the snaking path at this item's Y position
                        const decoY = d.yFrac * totalHeight;
                        const exactLevel = maxLevelToShow - (decoY / ITEM_HEIGHT);
                        const amp = width / 2 - 60;
                        const pathXAtDecoY = width / 2 + Math.sin(exactLevel * 0.65) * amp;
                        const decoX = d.xFrac * width;

                        // If the decoration is closer than 55px (node radius 32px + padding) to the path center, 
                        // completely hide it to keep the path totally clean!
                        if (Math.abs(decoX - pathXAtDecoY) < 55) {
                            return null;
                        }

                        // Image base sizes (slightly larger to pop more)
                        const SZ: Record<string, number> = {
                            diya: 64, coin: 56, rudraksha: 60,
                        };
                        const imgSz = SZ[d.type] ?? 0;
                        // Boost opacity to make them darker/clearer
                        const bumpedOpacity = Math.min(1, d.opacity * 1.6);
                        
                        return (
                            <View
                                key={`bg-${i}`}
                                pointerEvents="none"
                                style={{
                                    position: 'absolute',
                                    top:  d.yFrac * totalHeight,
                                    left: d.xFrac * width,
                                    opacity: bumpedOpacity,
                                    transform: [{ rotate: `${d.rotate}deg` }],
                                    zIndex: 0,
                                    // Golden shadow so they pop cleanly from the background
                                    shadowColor: '#F89626',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 6,
                                    elevation: 0,
                                }}
                            >
                                {d.type === 'diya' && (
                                    <Image source={DIYA_IMG}
                                        style={{ width: imgSz, height: imgSz }}
                                        resizeMode="contain" />
                                )}
                                {d.type === 'coin' && (
                                    <Image source={COIN_IMG}
                                        style={{ width: imgSz, height: imgSz }}
                                        resizeMode="contain" />
                                )}
                                {d.type === 'rudraksha' && (
                                    <Image source={RUDRAKSHA_IMG}
                                        style={{ width: imgSz, height: imgSz, borderRadius: imgSz / 2 }}
                                        resizeMode="cover" />
                                )}
                                {d.type === 'om' && (
                                    <Text style={{
                                        fontSize: 44, color: '#B85400',
                                        fontWeight: '900',
                                        textShadowColor: 'rgba(184,84,0,0.25)',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 4,
                                    }}>ॐ</Text>
                                )}
                                {d.type === 'sparkle' && (
                                    <Text style={{ fontSize: 28 }}>✨</Text>
                                )}
                                {d.type === 'mala' && (
                                    <Text style={{ fontSize: 34 }}>📿</Text>
                                )}
                                {d.type === 'flower' && (
                                    <Text style={{ fontSize: 30 }}>
                                        {['🌸', '🌺', '🌼', '🌻', '🌷'][i % 5]}
                                    </Text>
                                )}
                            </View>
                        );
                    })}

                    {/* ─── Render path segments + nodes ─── */}
                    {reversedLevels.map((lvl, index) => {
                        const isCurrent = lvl === currentLevel;
                        const isUnlocked = lvl <= currentLevel;
                        const isMilestone = MILESTONE_LEVELS.has(lvl);
                        const isGift = lvl > 0 && lvl % 5 === 0;
                        const isBig = isMilestone || isGift;
                        const sz = isBig ? BIG_NODE : NODE_SIZE;

                        const x = getXOffset(lvl);
                        const top = index * ITEM_HEIGHT;
                        const ms = getMilestoneForLevel(lvl);
                        const deityImg = DEITY_IMAGES[(lvl - 1) % DEITY_IMAGES.length];

                        /* ── Path segment (road between nodes) ── */
                        let pathEl: React.ReactNode = null;
                        if (index > 0) {
                            const prevLvl = reversedLevels[index - 1]; // Higher level (top of SVG, y=0)
                            const lvlAtBottom = reversedLevels[index];     // Lower level (bottom of SVG, y=ITEM_HEIGHT)
                            const prevX = getXOffset(prevLvl);
                            const currentX = getXOffset(lvlAtBottom);

                            // ── SVG bezier paths ──────────────────────────────────────────────
                            // Forward: top node → bottom node (used for beige bg + fully-lit orange)
                            const pd = `M ${prevX} 0 C ${prevX} ${ITEM_HEIGHT / 2}, ${currentX} ${ITEM_HEIGHT / 2}, ${currentX} ${ITEM_HEIGHT}`;

                            // Reversed: starts at bottom node (current level) and curves upward.
                            // strokeDasharray on this path fills FROM the current-level node upward
                            // with a natural rounded cap — identical behaviour to the pill progress bar.
                            const pdReversed = `M ${currentX} ${ITEM_HEIGHT} C ${currentX} ${ITEM_HEIGHT / 2}, ${prevX} ${ITEM_HEIGHT / 2}, ${prevX} 0`;

                            // ── Estimate actual path length for this segment ──────────────────
                            // Chord (straight-line distance between node centers) × 1.25 gives a
                            // safe upper bound for our symmetric cubic bezier.
                            const dx = prevX - currentX;
                            const chord = Math.sqrt(dx * dx + ITEM_HEIGHT * ITEM_HEIGHT);
                            const ESTIMATED_LEN = chord * 1.25;

                            // ── Key insight: the path starts at the NODE CENTER ───────────────
                            // The node circle has radius = sz/2, so the first nodeRadius pixels
                            // of fillDash are always HIDDEN under the node circle.
                            // We MUST add nodeRadius to fillDash so that the orange extends
                            // past the node edge and is actually visible.
                            //
                            // Example (9% progress, sz=52):
                            //   ESTIMATED_LEN ≈ 150px
                            //   Without fix: fillDash = 150×0.09 = 13.5px  → hidden under 26px node → NOTHING VISIBLE
                            //   With fix:    fillDash = 26 + 13.5 = 39.5px → 13.5px visible above node ✓
                            const nodeRadius = sz / 2;
                            const fillDash = nodeRadius + ESTIMATED_LEN * progressFrac;
                            // Gap must be comfortably larger than the remaining path length
                            const gapDash = ESTIMATED_LEN + nodeRadius + 50;

                            const isFullyLit = prevLvl <= currentLevel && lvlAtBottom <= currentLevel;
                            const isCurrentPath = lvlAtBottom === currentLevel && prevLvl === currentLevel + 1;

                            pathEl = (
                                <View style={{
                                    position: 'absolute',
                                    top: (index - 1) * ITEM_HEIGHT + ITEM_HEIGHT / 2,
                                    left: 0, width, height: ITEM_HEIGHT, zIndex: 0,
                                }}>
                                    <Svg width={width} height={ITEM_HEIGHT}>

                                        {/* Layer 1 – beige track (always visible, gives the empty look) */}
                                        <Path d={pd} fill="none"
                                            stroke="#E6C28F"
                                            strokeWidth={ROAD_INNER}
                                            strokeLinecap="round" />

                                        {/* Layer 2 – fully completed segment: solid orange full path */}
                                        {isFullyLit && (
                                            <Path d={pd} fill="none"
                                                stroke="#F89626"
                                                strokeWidth={ROAD_INNER}
                                                strokeLinecap="round" />
                                        )}

                                        {/* Layer 3 – current-level segment: orange fill growing
                                            from the current-level node upward by progressFrac.
                                            fillDash includes nodeRadius so the visible tip
                                            always appears above (not hidden under) the node circle.
                                            The natural round strokeCap gives the pill-bar look. */}
                                        {isCurrentPath && (
                                            <Path d={pdReversed} fill="none"
                                                stroke="#F89626"
                                                strokeWidth={ROAD_INNER}
                                                strokeLinecap="round"
                                                strokeDasharray={[fillDash, gapDash]}
                                            />
                                        )}

                                    </Svg>
                                </View>
                            );
                        }

                        /* ── Node animation ── */
                        const animStyle = isCurrent
                            ? { zIndex: 20 }
                            : { zIndex: isUnlocked ? 8 : 3 };

                        /* ── Node colors (vibrant game theme with cycling) ── */
                        const getNodeColors = () => {
                            // ── Locked: Professional light cream / empty look
                            if (!isUnlocked) return {
                                outer: 'transparent',
                                inner: ['#FFFFFF', '#FFECB3', '#FFE0B2'],
                                border: '#FFCA28',
                                iconColor: '#7A3800',
                            };

                            // ── Unlocked (Current or Completed): Professional Orange theme
                            // All unlocked levels now match the brand orange for consistency
                            return {
                                outer: 'transparent',
                                inner: ['#FFB74D', '#F89626', '#F89626'],
                                border: 'transparent', // Removed border as requested
                                iconColor: '#FFFFFF',
                            };
                        };
                        const nc = getNodeColors();

                        return (
                            <React.Fragment key={`lv-${lvl}`}>
                                {pathEl}

                                <Animated.View style={[
                                    styles.nodeWrapper,
                                    { left: x - sz / 2, top: top - sz / 2 + ITEM_HEIGHT / 2, width: sz, height: sz + 30 },
                                    animStyle,
                                ]}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={[styles.nodeTouchable, { width: sz + 10, height: sz + 30 }]}
                                        onPress={() => {
                                            hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                            onSelectMilestone(lvl);
                                        }}
                                    >
                                        {/* ── Outer shadow ring ── */}
                                        <View style={[
                                            styles.nodeOuter,
                                            { width: sz + 4, height: sz + 4, borderRadius: (sz + 4) / 2, backgroundColor: nc.outer },
                                            isCurrent && styles.nodeShadowCurrent,
                                        ]}>
                                            {/* ── Border ring ── */}
                                            <View style={[
                                                styles.nodeBorderRing,
                                                { width: sz, height: sz, borderRadius: sz / 2, borderColor: nc.border, borderWidth: 3 },
                                            ]}>
                                                {/* ── Inner gradient circle ── */}
                                                <LinearGradient
                                                    colors={nc.inner as [string, string, ...string[]]}
                                                    start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                                                    style={[styles.nodeInner, {
                                                        width: sz - 4, height: sz - 4, borderRadius: (sz - 4) / 2,
                                                    }]}
                                                >

                                                    {/* Level number — always visible */}
                                                    <Text style={[
                                                        styles.nodeLevelText,
                                                        isBig && { fontSize: 20 },
                                                        !isUnlocked && { color: '#7A3800', fontSize: 13 },
                                                        isUnlocked && { color: '#FFFFFF' },
                                                    ]}>
                                                        {lvl}
                                                    </Text>
                                                    {!isUnlocked && (
                                                        <Ionicons name="lock-closed" size={10} color={nc.iconColor} style={{ position: 'absolute', bottom: 4 }} />
                                                    )}
                                                </LinearGradient>
                                            </View>
                                        </View>

                                        {/* ── 3-Star indicator for completed levels (Professional Top-Arch) ── */}
                                        {isUnlocked && (
                                            <View style={styles.starsContainer}>
                                                <Ionicons name="star" size={15} color="#FFD700" style={[styles.starShadow, styles.starSideLeft]} />
                                                <Ionicons name="star" size={20} color="#FFDF00" style={[styles.starShadow, styles.starCenter]} />
                                                <Ionicons name="star" size={15} color="#FFD700" style={[styles.starShadow, styles.starSideRight]} />
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {/* ── Milestone emoji crown above node ── */}
                                    {isMilestone && isUnlocked && (
                                        <View style={[styles.crownBadge, { top: -28 }]}>
                                            <Text style={styles.crownEmoji}>{ms.emoji}</Text>
                                        </View>
                                    )}

                                    {/* ── Gift reward badge on the side ── */}
                                    {isGift && (
                                        <View style={[
                                            styles.giftWrap,
                                            x < width / 2 ? { left: sz + 2 } : { right: sz + 2 },
                                        ]}>
                                            <View style={[styles.giftBadge, !isUnlocked && styles.giftBadgeLocked, { backgroundColor: '#FF8A80', borderColor: '#D50000', borderWidth: 2 }]}>
                                                <Text style={{ fontSize: 16, lineHeight: 20 }}>🎁</Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* ── "YOU" indicator ── */}
                                    {isCurrent && (
                                        <View style={[
                                            styles.youWrap,
                                            x < width / 2 ? { left: sz + 4 } : { right: sz + 4 },
                                        ]}>
                                            <LinearGradient
                                                colors={['#E65100', '#FF9C26']}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                style={styles.youBadge}
                                            >
                                                <Text style={styles.youTxt}>YOU</Text>
                                                <Ionicons name="caret-forward" size={12} color="#FFF" />
                                            </LinearGradient>
                                        </View>
                                    )}

                                </Animated.View>
                            </React.Fragment>
                        );
                    })}
                </ScrollView>

                {/* ─── Floating header bar ─── */}
                <LinearGradient
                    colors={['#F89626', '#E65100']}
                    style={[styles.header, { paddingTop: insets.top + 8 }]}
                >
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => {
                            hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Medium);
                            onClose();
                        }}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{t('levelScreen.milestones')}</Text>
                        <View style={styles.headerLvlRow}>
                            <Text style={styles.headerLvlLabel}>Level </Text>
                            <Text style={styles.headerLvlNum}>{currentLevel}</Text>
                        </View>
                    </View>

                    <View style={styles.headerRight}>
                        <Image source={COIN_IMG} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    </View>
                </LinearGradient>

                {/* ─── Bottom gradient fade ─── */}
                <LinearGradient
                    colors={['rgba(255,248,238,0)', 'rgba(248,150,38,0.35)', 'rgba(230,81,0,0.55)']}
                    style={styles.bottomFade}
                    pointerEvents="none"
                />

            </Animated.View>
        </Modal>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFF5E6',
    },

    /* ── Grassy ground ── */
    groundLayer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.35,
    },

    /* ── Header ── */
    header: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingBottom: 14,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
        shadowColor: '#C64A00',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 100,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    headerCenter: {
        flex: 1, alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_700Bold',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    headerLvlRow: {
        flexDirection: 'row', alignItems: 'baseline',
    },
    headerLvlLabel: {
        fontSize: 10,
        fontFamily: 'Poppins_400Regular',
        color: 'rgba(255,255,255,0.82)',
    },
    headerLvlNum: {
        fontSize: 13,
        fontFamily: 'Poppins_700Bold',
        color: '#FFF9E6',
    },
    headerRight: {
        width: 38, alignItems: 'center',
    },

    /* ── Nodes ── */
    nodeWrapper: {
        position: 'absolute',
        alignItems: 'center',
    },
    nodeTouchable: {
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    nodeOuter: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 6,
    },
    nodeShadowCurrent: {
        shadowColor: '#FF8C00',
        shadowOpacity: 0.7,
        shadowRadius: 14,
        elevation: 14,
    },
    nodeBorderRing: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    nodeInner: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    nodeShine: {
        position: 'absolute',
        top: 3,
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    nodeLevelText: {
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
        color: '#7A3800',
    },

    /* ── 3-Star Badges ── */
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: -14,
        width: '100%',
        gap: 1,
        zIndex: 15,
    },
    starCenter: {
        marginTop: -6, // Lift the center star for an arched look
        zIndex: 2,
    },
    starSideLeft: {
        transform: [{ rotate: '-18deg' }],
        marginTop: 4,
        zIndex: 1,
    },
    starSideRight: {
        transform: [{ rotate: '18deg' }],
        marginTop: 4,
        zIndex: 1,
    },
    starShadow: {
        textShadowColor: 'rgba(160, 60, 0, 0.85)',
        textShadowOffset: { width: 0, height: 1.5 },
        textShadowRadius: 2,
    },

    /* ── Crown / milestone emoji ── */
    crownBadge: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        zIndex: 30,
    },
    crownEmoji: {
        fontSize: 16,
    },

    /* ── Gift deity badge ── */
    giftWrap: {
        position: 'absolute',
        top: 0,
    },
    giftBadge: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFF4CC',
        borderWidth: 1.5,
        borderColor: '#F0A500',
        shadowColor: '#F0A500',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
        elevation: 4,
    },
    giftBadgeLocked: {
        backgroundColor: '#EEEEEE',
        borderColor: '#BDBDBD',
        opacity: 0.5,
    },
    giftDeity: {
        width: 20, height: 20, borderRadius: 10,
    },

    /* ── YOU badge ── */
    youWrap: {
        position: 'absolute',
        top: 6,
    },
    youBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 2,
        shadowColor: '#C64A00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.45,
        shadowRadius: 4,
        elevation: 6,
    },
    youTxt: {
        color: '#FFF',
        fontSize: 9,
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 0.8,
    },

    /* ── Bottom fade ── */
    bottomFade: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 100,
    },

    /* ── Decorative game elements ── */
    treeContainer: {
        width: 60, height: 80,
        alignItems: 'center', justifyContent: 'flex-end',
    },
    treeTrunk: {
        width: 12, height: 24,
        backgroundColor: '#795548',
        borderRadius: 4,
    },
    treeCrown: {
        position: 'absolute', top: 0,
        width: 50, height: 50,
        backgroundColor: '#F06292',
        borderRadius: 25,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
        elevation: 4,
    },
    treeCrownOverlay: {
        position: 'absolute', top: 5, right: 10,
        width: 20, height: 20,
        backgroundColor: '#F48FB1',
        borderRadius: 10,
    },
    bushContainer: {
        width: 65, height: 45,
    },
    bushCircle: {
        position: 'absolute',
        backgroundColor: '#66BB6A',
        borderRadius: 25,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2,
        elevation: 3,
    },

    /* ── Decorative background circles ── */
    decoCircleLeft: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(200,100,0,0.18)',
        top: '15%',
        left: -80,
    },
    decoCircleRight: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(200,100,0,0.14)',
        top: '40%',
        right: -100,
    },
    decoCircleBottomLeft: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(200,100,0,0.12)',
        bottom: '10%',
        left: -60,
    },

});



