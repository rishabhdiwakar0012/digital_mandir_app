import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';
import { Assets } from '../../../theme';
import * as hapticUtils from '../../../utils/hapticUtils';
import { Button } from '../../atoms/Button';
import { HeaderLogo } from '../../molecules';

import CoinsIcon from '../../../../assets/coins.svg';
import AmazingIcon from '../../../../assets/amazing.svg';

interface JaapCompleteScreenProps {
    onBack?: () => void;
    onContinue: () => void;
    coins?: number;
    performance?: number;
    duration?: number; // in seconds
}

/** Format seconds to MM:SS */
const formatDuration = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const JaapCompleteScreen: React.FC<JaapCompleteScreenProps> = ({
    onBack,
    onContinue,
    coins = 15,
    performance = 100,
    duration = 0,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => {
            onContinue();
        }, 3000); // Show for 3 seconds then auto-advance to StreakScreen
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTopContent}>
                    <HeaderLogo />
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.contentContainer}>
                <Image
                    source={Assets.jaapStartImage}
                    style={styles.image}
                    resizeMode="contain"
                />

                <Text style={styles.title}>{t('jaapCompleteScreen.title')}</Text>

                <View style={styles.statsContainer}>
                    {/* Total Coins Card */}
                    <View style={[styles.card, { borderColor: '#FFA14A' }]}>
                        <View style={[styles.cardHeader, { backgroundColor: '#FFA14A' }]}>
                            <Text style={styles.cardHeaderText}>{t('jaapCompleteScreen.coins')}</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.iconWrapper}>
                                <CoinsIcon width={24} height={24} />
                            </View>
                            <Text style={[styles.statValue, { color: '#FFA14A' }]}>{coins}</Text>
                        </View>
                    </View>

                    {/* Time Taken Card */}
                    <View style={[styles.card, { borderColor: '#66BB6A' }]}>
                        <View style={[styles.cardHeader, { backgroundColor: '#66BB6A' }]}>
                            <Text style={styles.cardHeaderText}>{t('jaapCompleteScreen.timeTaken')}</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.iconWrapper}>
                                <Ionicons name="timer-outline" size={22} color="#66BB6A" />
                            </View>
                            <Text style={[styles.statValue, { color: '#66BB6A', fontSize: 18 }]}>
                                {formatDuration(duration)}
                            </Text>
                        </View>
                    </View>

                    {/* Performance Card */}
                    <View style={[styles.card, { borderColor: '#31A3F8' }]}>
                        <View style={[styles.cardHeader, { backgroundColor: '#31A3F8' }]}>
                            <Text style={styles.cardHeaderText}>{t('jaapCompleteScreen.performance')}</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.iconWrapper}>
                                <AmazingIcon width={20} height={18} />
                            </View>
                            <Text style={[styles.statValue, { color: '#31A3F8' }]}>{performance}%</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer Button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                <Button
                    title={t('jaapCompleteScreen.continueButton')}
                    variant="primary"
                    fullWidth
                    onPress={() => {
                        hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                        onContinue();
                    }}
                />
            </View>
        </View>
    );
};
