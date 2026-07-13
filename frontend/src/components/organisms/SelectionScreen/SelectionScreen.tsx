import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    LayoutAnimation,
    Platform as RNPlatform,
    useWindowDimensions,
    TextInput
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as hapticUtils from '../../../utils/hapticUtils';
import { styles } from './styles';
import { Button } from '../../atoms/Button';
import { HeaderLogo } from '../../molecules';
import { SelectionOption, SelectionScreenProps } from './types';
import { Assets } from '../../../theme';


const ALL_OPTIONS: SelectionOption[] = [
    { id: 'festival', titleKey: 'selectionScreen.festivalTitle', iconName: 'candle' },
    { id: 'god', titleKey: 'selectionScreen.godTitle', iconName: 'om' },
    { id: 'special', titleKey: 'selectionScreen.specialTitle', iconName: 'flower-lotus' },
    { id: 'custom', titleKey: 'selectionScreen.customTitle', iconName: 'script-text-outline' },
];

export const SelectionScreen: React.FC<SelectionScreenProps> = ({
    onBack,
    onContinue,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { height: windowHeight } = useWindowDimensions();
    const isSmallScreen = windowHeight < 700;
    const isExtraSmallScreen = windowHeight < 680;
    const iconSize = isExtraSmallScreen ? 32 : isSmallScreen ? 40 : 48; // Adjusted size
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const filteredOptions = ALL_OPTIONS.filter(o => 
        t(o.titleKey).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (id: string) => {
        // LayoutAnimation removed to prevent size jumping/glitching
        setSelectedId(prevId => (prevId === id ? null : id));
    };

    const handleContinue = () => {
        if (selectedId) {
            hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
            onContinue(selectedId);
        }
    };

    const renderCardContent = (option: SelectionOption, isSelected: boolean) => {
        const iconColor = isSelected ? '#FFFFFF' : '#B48628'; // White when selected, Gold (#B48628) when not

        // Specific style for Diya icon to ensure it fits well
        const iconStyle = { marginBottom: styles.icon.marginBottom };

        return (
            <>

                {/* Icon */}
                {option.id === 'festival' ? (
                    <View style={iconStyle}>
                        <Image
                            source={Assets.diwaliLamp}
                            style={{ width: iconSize, height: iconSize, tintColor: iconColor } as any}
                            resizeMode="contain"
                        />
                    </View>
                ) : option.id === 'special' ? (
                    <View style={iconStyle}>
                        <Image
                            source={Assets.lotus}
                            style={{ width: iconSize, height: iconSize, tintColor: iconColor } as any}
                            resizeMode="contain"
                        />
                    </View>
                ) : option.id === 'custom' ? (
                    <MaterialCommunityIcons
                        name="script-text-outline"
                        size={iconSize}
                        color={iconColor}
                        style={styles.icon}
                    />
                ) : (
                    <MaterialCommunityIcons
                        name={option.iconName as any}
                        size={iconSize}
                        color={iconColor}
                        style={styles.icon}
                    />
                )}

                {/* Text */}
                <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>
                    {t(option.titleKey)}
                </Text>

                {/* Checkmark Overlay */}
                {isSelected && (
                    <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark" size={14} color="#D35400" />
                    </View>
                )}
            </>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.flexContainer, { backgroundColor: '#FFF8F0', paddingTop: insets.top + 20 }]}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="on-drag"
                >
                    {/* Index 0: Header Content (scrolls away) */}
                    <View style={styles.headerTopContent}>
                        <HeaderLogo />
                    </View>

                    {/* Index 1: Sticky Search Bar (Hidden per user request) */}
                    {/*
                    <View style={{ backgroundColor: '#FFF8F0', paddingBottom: 16, marginHorizontal: -16, paddingHorizontal: 16, zIndex: 10 }}>
                        <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={isSearchFocused ? "#E65100" : "#8D6E63"}
                                style={{ marginRight: 8 }}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('selectionScreen.search', 'Search...')}
                                placeholderTextColor="#8D6E63"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </View>
                    </View>
                    */}

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
                                    width: 380, // Increased size
                                    height: 380,
                                    opacity: 0.15,
                                    tintColor: '#D4AF37',
                                }}
                                resizeMode="contain"
                            />
                        </View>

                        {filteredOptions.map((option) => {
                            const isSelected = selectedId === option.id;

                            if (isSelected) {
                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[styles.card, styles.cardSelectedContainer]}
                                        onPress={() => handleSelect(option.id)}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={['#D35400', '#E67E22', '#F39C12']} // Dark Orange to Light Orange gradient
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.cardGradient}
                                        >
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
                                            {renderCardContent(option, isSelected)}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={styles.card}
                                    onPress={() => handleSelect(option.id)}
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
                                        {renderCardContent(option, isSelected)}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Footer Button - only visible when an option is selected */}
                {selectedId && (
                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <Button
                            title={t('selectionScreen.continue')}
                            variant="primary"
                            fullWidth
                            onPress={handleContinue}
                        />
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};
