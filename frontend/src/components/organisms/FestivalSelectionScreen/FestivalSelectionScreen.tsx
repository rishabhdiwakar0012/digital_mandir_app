import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    TextInput,
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Dimensions,
    ImageSourcePropType,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as hapticUtils from '../../../utils/hapticUtils';
import { Assets } from '../../../theme';
import { useFestivals } from '../../../api/hooks/useContent';
import { Button } from '../../atoms/Button';
import { HeaderLogo } from '../../molecules';
import { styles } from './styles';

export type FestivalId = string;

export interface FestivalOption {
    id: FestivalId;
    nameKey: string; // i18n translation key
    iconName: string; // MaterialCommunityIcons name
    name?: { en: string; hi: string; sa?: string };
    imageUrl?: string;
}



export interface FestivalSelectionScreenProps {
    onBack: () => void;
    onContinue: (festivalId: FestivalId) => void;
}

export const FestivalSelectionScreen: React.FC<FestivalSelectionScreenProps> = ({
    onBack,
    onContinue,
}) => {
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const { height: windowHeight } = useWindowDimensions();
    const isSmallScreen = windowHeight < 700;
    const isExtraSmallScreen = windowHeight < 680;
    const iconSize = isExtraSmallScreen ? 45 : isSmallScreen ? 55 : 70;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFestival, setSelectedFestival] = useState<FestivalId | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const { data: apiFestivals, isLoading: loading } = useFestivals();

    const festivals: FestivalOption[] = useMemo(() => {
        if (!apiFestivals || apiFestivals.length === 0) return [];
        return apiFestivals.map((f) => ({
            id: f.slug || f._id,
            nameKey: '',
            iconName: f.iconName || 'star',
            name: f.title,
            imageUrl: f.imageUrl,
        }));
    }, [apiFestivals]);

    const getFestivalDisplayName = (festival: FestivalOption): string => {
        if (festival.name) {
            const lang = i18n.language;
            return festival.name[lang as keyof typeof festival.name] || festival.name.hi || festival.name.en;
        }
        return t(festival.nameKey);
    };

    const filteredFestivals = useMemo(() => {
        if (!searchQuery.trim()) return festivals;
        return festivals.filter(f =>
            getFestivalDisplayName(f).toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, festivals, i18n.language]);

    const renderCardContent = (festival: FestivalOption, isSelected: boolean) => {
        const iconColor = isSelected ? '#FFFFFF' : '#B48628';
        return (
            <>
                <View style={[styles.imageContainer, { width: iconSize + 10, height: iconSize + 10 }]}>
                    {festival.imageUrl ? (
                        <Image
                            source={{ uri: festival.imageUrl }}
                            style={{ width: iconSize, height: iconSize }}
                            resizeMode="contain"
                        />
                    ) : (
                        <MaterialCommunityIcons
                            name={festival.iconName as any}
                            size={iconSize}
                            color={iconColor}
                        />
                    )}
                </View>

                {/* Text */}
                <View style={styles.nameBadge}>
                    <Text
                        style={[styles.nameText, isSelected && styles.nameTextSelected]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {getFestivalDisplayName(festival)}
                    </Text>
                </View>

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
                    stickyHeaderIndices={[1]}
                    keyboardDismissMode="on-drag"
                >
                    {/* Index 0: Header Content */}
                    <View style={styles.headerTopContent}>
                        <HeaderLogo />
                    </View>

                    {/* Index 1: Sticky Search Bar */}
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
                                placeholder={t('festivalSelectionScreen.search')}
                                placeholderTextColor="#8D6E63"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </View>
                    </View>
                    {/* Grid */}
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                            <ActivityIndicator size="large" color="#D35400" />
                        </View>
                    ) : (
                    <View style={styles.grid}>
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

                        {filteredFestivals.map((festival) => {
                            const isSelected = selectedFestival === festival.id;

                            if (isSelected) {
                                return (
                                    <TouchableOpacity
                                        key={festival.id}
                                        style={[styles.card, styles.cardSelectedContainer]}
                                        onPress={() => setSelectedFestival(festival.id)}
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
                                            {renderCardContent(festival, isSelected)}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={festival.id}
                                    style={styles.card}
                                    onPress={() => setSelectedFestival(festival.id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardContent}>
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
                                        {renderCardContent(festival, isSelected)}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    )}
                </ScrollView>

                {/* Footer Button */}
                {selectedFestival && (
                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
                        <Button
                            title={t('festivalSelectionScreen.continue')}
                            variant="primary"
                            fullWidth
                            onPress={() => {
                                if (selectedFestival) {
                                    hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                    onContinue(selectedFestival);
                                }
                            }}
                        />
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};
