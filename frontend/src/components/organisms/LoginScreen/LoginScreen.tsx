import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, useWindowDimensions, Animated, Easing, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { Assets } from '../../../theme';
import { Button } from '../../atoms/Button';
import { HeaderLogo } from '../../molecules';

interface LoginScreenProps {
    onLogin: () => void;
    onSignup: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSignup }) => {
    const { t } = useTranslation();
    const { height, width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const isSmallScreen = height < 700;
    const isExtraSmallScreen = height < 680;

    // ── Responsive sizes ─────────────────────────────────────────────────────
    const containerSize = Math.min(width * 0.8, isExtraSmallScreen ? 270 : isSmallScreen ? 310 : 350);
    const mainImageSize = containerSize * 0.85;

    const topLeftSize = containerSize * 0.34;
    const topRightSize = containerSize * 0.38;
    const bottomLeftSize = containerSize * 0.38;
    const bottomRightSize = containerSize * 0.32;

    const titleSize = isExtraSmallScreen ? 25 : isSmallScreen ? 27 : 30;
    const subtitleSmallSize = isExtraSmallScreen ? 17 : isSmallScreen ? 19 : 21;
    const subtitleLargeSize = isExtraSmallScreen ? 17 : isSmallScreen ? 19 : 22;
    const subtitleLineHeight = isExtraSmallScreen ? 26 : isSmallScreen ? 30 : 36;
    const buttonTextSize = isExtraSmallScreen ? 10 : isSmallScreen ? 11 : 12;
    const buttonPadding = isExtraSmallScreen ? 10 : isSmallScreen ? 11 : 12;
    const imageGap = isExtraSmallScreen ? 8 : isSmallScreen ? 12 : 16;
    const textGap = isExtraSmallScreen ? 4 : isSmallScreen ? 6 : 10;

    // ── Animations ───────────────────────────────────────────────────────────
    const centerFloat = useRef(new Animated.Value(0)).current;
    const cornerFloat1 = useRef(new Animated.Value(0)).current;
    const cornerFloat2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(centerFloat, { toValue: -10, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(centerFloat, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(cornerFloat1, { toValue: -8, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(cornerFloat1, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();

        setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(cornerFloat2, { toValue: -8, duration: 2800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                    Animated.timing(cornerFloat2, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                ])
            ).start();
        }, 500);
    }, []);

    const subtitleText = t('loginScreen.subtitle');
    const [subtitlePart1, subtitlePart2] = subtitleText.includes('\n')
        ? subtitleText.split('\n')
        : [subtitleText, ''];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

            {/* ─── Header ─────────────────────────────────────────── */}
            <View style={[styles.header, { paddingTop: isExtraSmallScreen ? 8 : 12, paddingBottom: isExtraSmallScreen ? 4 : 8 }]}>
                <HeaderLogo />
            </View>

            {/* ─── Scrollable content (image + text) ──────────────── */}
            <ScrollView
                contentContainerStyle={[styles.contentContainer, { paddingVertical: imageGap }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Group — floating images untouched */}
                <View style={[styles.imageContainer, { width: containerSize, height: containerSize, marginBottom: imageGap }]}>
                    {/* Center Image */}
                    <Animated.Image
                        source={Assets.loginMain}
                        style={{ width: mainImageSize, height: mainImageSize, transform: [{ translateY: centerFloat }] }}
                        resizeMode="contain"
                    />

                    {/* Corner Images */}
                    <Animated.Image
                        source={Assets.loginTopLeft}
                        style={{ position: 'absolute', top: containerSize * 0.15, left: -10, width: topLeftSize, height: topLeftSize, transform: [{ translateY: cornerFloat1 }] }}
                        resizeMode="contain"
                    />
                    <Animated.Image
                        source={Assets.loginTopRight}
                        style={{ position: 'absolute', top: containerSize * 0.05, right: containerSize * -0.05, width: topRightSize, height: topRightSize, transform: [{ translateY: cornerFloat2 }] }}
                        resizeMode="contain"
                    />
                    <Animated.Image
                        source={Assets.loginBottomLeft}
                        style={{ position: 'absolute', bottom: 0, left: -20, width: bottomLeftSize, height: bottomLeftSize, transform: [{ translateY: cornerFloat2 }] }}
                        resizeMode="contain"
                    />
                    <Animated.Image
                        source={Assets.loginBottomRight}
                        style={{ position: 'absolute', bottom: -containerSize * -0.05, right: -containerSize * 0.05, width: bottomRightSize, height: bottomRightSize, transform: [{ translateY: cornerFloat1 }] }}
                        resizeMode="contain"
                    />
                </View>

                {/* Text Content */}
                <View style={[styles.textContainer, { marginTop: textGap }]}>
                    <Text style={[styles.title, { fontSize: titleSize }]}>
                        {t('loginScreen.title')}
                    </Text>
                    <Text style={[styles.subtitle, { lineHeight: subtitleLineHeight }]}>
                        <Text style={{ fontSize: subtitleSmallSize }}>{subtitlePart1}{'\n'}</Text>
                        <Text style={{ fontSize: subtitleLargeSize }}>{subtitlePart2}</Text>
                    </Text>
                </View>
            </ScrollView>

            {/* ─── Footer (buttons) — pinned at bottom ────────────── */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), paddingTop: isExtraSmallScreen ? 8 : 12 }]}>
                <Button
                    title={t('loginScreen.primaryButton')}
                    variant="primary"
                    fullWidth
                    onPress={onSignup}
                    textStyle={{ fontSize: 13 }}
                    style={{ paddingBottom: 16 }}
                />
                
                <View style={{ height: 4 }} />

                <Button
                    title={t('loginScreen.secondaryButton')}
                    variant="outline"
                    fullWidth
                    onPress={onLogin}
                    textStyle={{ fontSize: buttonTextSize }}
                    style={{ paddingBottom: 16 }} // Increased bottom padding for better 3D centering
                />
            </View>
        </View>
    );
};
