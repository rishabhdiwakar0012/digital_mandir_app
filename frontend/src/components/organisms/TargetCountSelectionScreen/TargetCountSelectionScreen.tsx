import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as hapticUtils from '../../../utils/hapticUtils';
import { Assets } from '../../../theme';
import { Button } from '../../atoms/Button';
import { HeaderLogo } from '../../molecules';
import { styles } from './styles';

export interface TargetCountSelectionScreenProps {
    onBack: () => void;
    onContinue: (targetCount: number) => void;
}

const TARGET_COUNTS = [11, 21, 51, 108];

export const TargetCountSelectionScreen: React.FC<TargetCountSelectionScreenProps> = ({
    onBack,
    onContinue,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [selectedCount, setSelectedCount] = useState<number | null>(null);
    const [customCount, setCustomCount] = useState<string>('');
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSelect = (count: number) => {
        setSelectedCount(prevCount => (prevCount === count ? null : count));
        if (count !== null) setCustomCount('');
    };

    const handleCustomCountChange = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        setCustomCount(numericValue);
        if (numericValue.length > 0) {
            setSelectedCount(null);
        }
    };

    const handleContinue = () => {
        if (selectedCount !== null) {
            hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
            onContinue(selectedCount);
        } else if (customCount.length > 0) {
            const count = parseInt(customCount, 10);
            if (count > 0) {
                hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                onContinue(count);
            }
        }
    };

    const isContinueEnabled = selectedCount !== null || (customCount.length > 0 && parseInt(customCount, 10) > 0);

    const renderCardContent = (count: number, isSelected: boolean) => {
        return (
            <>
                {/* Text Content */}
                <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
                    {count}
                </Text>
                <Text style={[styles.countLabel, isSelected && styles.countLabelSelected]}>
                    {t('targetCountSelection.beads', 'Jaap')}
                </Text>

                {/* Checkmark Overlay */}
                {isSelected && (
                    <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark" size={16} color="#D35400" />
                    </View>
                )}
            </>
        );
    };

    return (
        // behavior="padding" on iOS shrinks the layout above keyboard.
        // behavior="height" on Android shrinks the KeyboardAvoidingView so the
        // inner ScrollView gains room to scroll the input into view.
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ flex: 1, backgroundColor: '#FFF8F0', paddingTop: insets.top + 20 }}>
                    <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        keyboardDismissMode="on-drag"
                    >
                        {/* Header Content */}
                        <View style={styles.headerTopContent}>
                            <HeaderLogo />
                        </View>

                        <Text style={styles.sectionTitle}>
                            {t('targetCountSelection.title', 'Set Jaap Target')}
                        </Text>

                        {/* Grid */}
                        <View style={styles.gridContainer}>
                            {/* Background Illustration for the Grid */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: -1,
                                }}
                            >
                                <Image
                                    source={Assets.cardBackground}
                                    style={{
                                        width: 380,
                                        height: 380,
                                        opacity: 0.15,
                                        tintColor: '#D4AF37',
                                    }}
                                    resizeMode="contain"
                                />
                            </View>

                            {TARGET_COUNTS.map((count) => {
                                const isSelected = selectedCount === count;

                                if (isSelected) {
                                    return (
                                        <TouchableOpacity
                                            key={count}
                                            style={[styles.card, styles.cardSelectedContainer]}
                                            onPress={() => handleSelect(count)}
                                            activeOpacity={0.9}
                                        >
                                            <LinearGradient
                                                colors={['#D35400', '#E67E22', '#F39C12']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.cardGradient}
                                            >
                                                {/* Illustration background inside selected card */}
                                                <Image
                                                    source={Assets.cardBackground}
                                                    style={{
                                                        position: 'absolute',
                                                        width: '100%',
                                                        height: '100%',
                                                        opacity: 0.15,
                                                        tintColor: '#FFFFFF',
                                                    } as any}
                                                    resizeMode="cover"
                                                />
                                                {renderCardContent(count, isSelected)}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                }

                                return (
                                    <TouchableOpacity
                                        key={count}
                                        style={styles.card}
                                        onPress={() => handleSelect(count)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.cardContent}>
                                            {/* Illustration background inside unselected card */}
                                            <Image
                                                source={Assets.cardBackground}
                                                style={{
                                                    position: 'absolute',
                                                    width: '100%',
                                                    height: '100%',
                                                    opacity: 0.15,
                                                    tintColor: '#D4AF37',
                                                } as any}
                                                resizeMode="cover"
                                            />
                                            {renderCardContent(count, isSelected)}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Custom Count Input */}
                        <View style={styles.customCountContainer}>
                            <Text style={styles.customCountLabel}>{t('targetCountSelection.customCount', 'Or Enter Custom Target')}</Text>
                            <TextInput
                                style={[styles.customCountInput, customCount.length > 0 && styles.customCountInputActive]}
                                value={customCount}
                                onChangeText={handleCustomCountChange}
                                keyboardType="numeric"
                                placeholder={t('targetCountSelection.customPlaceholder', 'e.g. 1008')}
                                placeholderTextColor="#BCAAA4"
                                maxLength={5}
                                onFocus={() => {
                                    setSelectedCount(null);
                                    // Scroll to bottom so the input is always visible above the keyboard
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 150);
                                }}
                            />
                        </View>
                    </ScrollView>

                    {/* Footer Button - only visible when an option is selected or entered */}
                    {isContinueEnabled && (
                        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                            <Button
                                title={t('targetCountSelection.continue', 'CONTINUE')}
                                variant="primary"
                                fullWidth
                                onPress={handleContinue}
                            />
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};
