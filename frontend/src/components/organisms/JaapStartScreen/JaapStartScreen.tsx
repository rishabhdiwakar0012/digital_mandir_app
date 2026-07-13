import React from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';
import { Assets } from '../../../theme';
import { Button } from '../../atoms/Button';

interface JaapStartScreenProps {
    onBack?: () => void;
    onStartCounter: () => void;
}

export const JaapStartScreen: React.FC<JaapStartScreenProps> = ({
    onBack,
    onStartCounter,
}) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 40 }} />
                <View style={styles.headerLogoContainer}>
                    <Image source={Assets.splashLogo} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.headerText}>DigitalMandir.in</Text>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.contentContainer}>
                <Image
                    source={Assets.jaapStartImage}
                    style={styles.image}
                    resizeMode="contain"
                />

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{t('jaapStartScreen.titlePrefix')}</Text>
                    <Text style={styles.subtitle}>{t('jaapStartScreen.titleMain')}</Text>
                    <Text style={styles.highlightText}>{t('jaapStartScreen.titleSuffix')}</Text>
                </View>
            </View>

            {/* Footer Button */}
            <View style={styles.footer}>
                <Button
                    title={t('jaapStartScreen.button')}
                    variant="primary"
                    fullWidth
                    onPress={onStartCounter}
                />
            </View>
        </View>
    );
};
