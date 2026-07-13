import React, { useEffect, useRef, useMemo } from 'react';
import { View, Image, Animated } from 'react-native';

// Configuration for the Mala
const BEAD_COUNT = 32;

// Support up to this many taps before wrapping
// Kept as a fallback only — callers should pass maxBeads for best perf
const DEFAULT_MAX_TAPS = 1000;

interface MalaProps {
    currentBeadIndex: number;
    /** Available width in dp for the mala area */
    availableWidth: number;
    /** Available height in dp for the mala area */
    availableHeight: number;
    /**
     * Upper bound on currentBeadIndex — used to size the animation
     * interpolation table. Pass targetCount+BEAD_COUNT for a 40× speedup.
     * Defaults to 1000 if not provided.
     */
    maxBeads?: number;
}

const TenMukhiRudraksha = require('../../../../../assets/rudraksh.png');

/**
 * Compute all derived geometry from the available space.
 * Uses 80% of width and 90% of height to leave room for beads on the edges.
 */
const computeGeometry = (availableWidth: number, availableHeight: number) => {
    let bestBeadSize = 10;
    let low = 10;
    let high = 120;
    
    // Binary search for the perfect bead size that perfectly fits the perimeter
    for (let i = 0; i < 20; i++) {
        let mid = (low + high) / 2;
        let mW = Math.max(0, availableWidth - mid);
        let mH = Math.max(0, availableHeight - mid * 2);
        let straight = Math.max(0, mH - mW);
        let perim = 2 * straight + Math.PI * mW;
        
        if (perim >= BEAD_COUNT * mid) {
            bestBeadSize = mid; // this fits
            low = mid; // try bigger
        } else {
            high = mid; // too big, overlaps
        }
    }
    
    // The beads will touch exactly at bestBeadSize without any extra gap.
    // Cap at 58 so they don't become huge on tablets
    const BEAD_SIZE = Math.min(bestBeadSize, 58);

    // Beads are centered on the perimeter, so only half a bead needs clearance per side
    const MALA_WIDTH = availableWidth - BEAD_SIZE;
    const MALA_HEIGHT = availableHeight - BEAD_SIZE * 2;

    const CORNER_RADIUS = MALA_WIDTH / 2;
    const STRAIGHT_LENGTH = Math.max(0, MALA_HEIGHT - MALA_WIDTH);
    const PERIMETER = 2 * STRAIGHT_LENGTH + 2 * Math.PI * CORNER_RADIUS;
    const DIST_PER_BEAD = PERIMETER / BEAD_COUNT;

    return { BEAD_SIZE, MALA_WIDTH, MALA_HEIGHT, CORNER_RADIUS, STRAIGHT_LENGTH, PERIMETER, DIST_PER_BEAD };
};

/**
 * Stadium perimeter position calculator.
 * d = distance along perimeter from top-center, going clockwise.
 */
const getStadiumPosition = (
    d: number,
    { CORNER_RADIUS, STRAIGHT_LENGTH, PERIMETER }: ReturnType<typeof computeGeometry>,
): { x: number; y: number } => {
    let dist = ((d % PERIMETER) + PERIMETER) % PERIMETER;

    const halfStraight = STRAIGHT_LENGTH / 2;
    const centerY_top = -halfStraight;
    const centerY_bottom = halfStraight;
    const topSemiLen = (Math.PI * CORNER_RADIUS) / 2;
    const bottomSemiLen = Math.PI * CORNER_RADIUS;

    if (dist < topSemiLen) {
        const angle = -Math.PI / 2 + (dist / CORNER_RADIUS);
        return {
            x: CORNER_RADIUS * Math.cos(angle),
            y: centerY_top + CORNER_RADIUS * Math.sin(angle),
        };
    }
    dist -= topSemiLen;

    if (dist < STRAIGHT_LENGTH) {
        return { x: CORNER_RADIUS, y: centerY_top + dist };
    }
    dist -= STRAIGHT_LENGTH;

    if (dist < bottomSemiLen) {
        const angle = dist / CORNER_RADIUS;
        return {
            x: CORNER_RADIUS * Math.cos(angle),
            y: centerY_bottom + CORNER_RADIUS * Math.sin(angle),
        };
    }
    dist -= bottomSemiLen;

    if (dist < STRAIGHT_LENGTH) {
        return { x: -CORNER_RADIUS, y: centerY_bottom - dist };
    }
    dist -= STRAIGHT_LENGTH;

    const angle = Math.PI + (dist / CORNER_RADIUS);
    return {
        x: CORNER_RADIUS * Math.cos(angle),
        y: centerY_top + CORNER_RADIUS * Math.sin(angle),
    };
};

/**
 * Pre-compute the interpolation input/output ranges for a single bead.
 */
const buildInterpolationRanges = (
    beadIndex: number,
    geometry: ReturnType<typeof computeGeometry>,
    maxTaps: number,
) => {
    const inputRange: number[] = [];
    const xOutput: number[] = [];
    const yOutput: number[] = [];

    for (let offset = 0; offset <= maxTaps; offset++) {
        // Adding offset moves each bead's d value forward (clockwise) with every tap
        const effectiveDist = (beadIndex + offset) * geometry.DIST_PER_BEAD;
        const pos = getStadiumPosition(effectiveDist, geometry);
        inputRange.push(offset);
        xOutput.push(pos.x);
        yOutput.push(pos.y);
    }

    return { inputRange, xOutput, yOutput };
};

export const Mala: React.FC<MalaProps> = ({ currentBeadIndex, availableWidth, availableHeight, maxBeads }) => {
    const offsetAnim = useRef(new Animated.Value(0)).current;
    const lastAnimValue = useRef(0);

    const resolvedMaxTaps = maxBeads ?? DEFAULT_MAX_TAPS;

    const geometry = useMemo(
        () => computeGeometry(availableWidth, availableHeight),
        [availableWidth, availableHeight],
    );

    useEffect(() => {
        const nextValue = lastAnimValue.current + 1;
        lastAnimValue.current = nextValue;

        Animated.spring(offsetAnim, {
            toValue: nextValue,
            useNativeDriver: true,
            friction: 14,
            tension: 90,
        }).start();
    }, [currentBeadIndex]);

    const { BEAD_SIZE, MALA_WIDTH, MALA_HEIGHT } = geometry;

    return (
        <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: availableWidth,
            height: availableHeight,
        }}>
            <View style={{
                width: MALA_WIDTH,
                height: MALA_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {Array.from({ length: BEAD_COUNT }).map((_, index) => (
                    <NativeBead
                        key={index}
                        index={index}
                        offsetAnim={offsetAnim}
                        geometry={geometry}
                        beadSize={BEAD_SIZE}
                        maxTaps={resolvedMaxTaps}
                    />
                ))}
            </View>
        </View>
    );
};

/**
 * Each bead uses Animated.interpolate to derive its x/y from the shared offset.
 * The interpolation runs on the native thread — zero JS overhead during animation.
 */
interface NativeBeadProps {
    index: number;
    offsetAnim: Animated.Value;
    geometry: ReturnType<typeof computeGeometry>;
    beadSize: number;
    maxTaps: number;
}

const NativeBead: React.FC<NativeBeadProps> = React.memo(({ index, offsetAnim, geometry, beadSize, maxTaps }) => {
    const { inputRange, xOutput, yOutput } = useMemo(
        () => buildInterpolationRanges(index, geometry, maxTaps),
        [index, geometry, maxTaps],
    );

    const animatedX = useMemo(
        () =>
            offsetAnim.interpolate({
                inputRange,
                outputRange: xOutput,
                extrapolate: 'clamp',
            }),
        [offsetAnim, inputRange, xOutput],
    );

    const animatedY = useMemo(
        () =>
            offsetAnim.interpolate({
                inputRange,
                outputRange: yOutput,
                extrapolate: 'clamp',
            }),
        [offsetAnim, inputRange, yOutput],
    );

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: beadSize,
                height: beadSize,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [
                    { translateX: animatedX },
                    { translateY: animatedY },
                ],
            }}
        >
            <Image
                source={TenMukhiRudraksha}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
            />
        </Animated.View>
    );
});
