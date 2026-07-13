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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as hapticUtils from '../../../utils/hapticUtils';
import { Assets } from '../../../theme';
import { useDeities } from '../../../api/hooks/useContent';
import { config } from '../../../config';
import { CachedImage } from '../../atoms/CachedImage';
import { Button } from '../../atoms/Button';
import { HeaderLogo } from '../../molecules';
import { styles } from './styles';

/** Build a fully-qualified URL for an imageUrl that may be relative ('/api/...') or absolute */
const resolveImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    // Strip the '/api' suffix from baseUrl to get the server root, then append relative path
    const serverRoot = config.api.baseUrl.replace(/\/api$/, '');
    return `${serverRoot}${imageUrl}`;
};

export type DeityId = string;

export interface DeityOption {
    id: DeityId;
    nameKey: string; // i18n translation key (kept for backwards compat)
    name?: { en: string; hi: string; sa?: string };
    image?: ImageSourcePropType;
    imageUrl?: string;
}



export interface GodSpecificScreenProps {
    onBack: () => void;
    onContinue: (deityId: DeityId) => void;
}

export const GodSpecificScreen: React.FC<GodSpecificScreenProps> = ({
    onBack,
    onContinue,
}) => {
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const { height: windowHeight } = useWindowDimensions();
    const isSmallScreen = windowHeight < 700;
    const isExtraSmallScreen = windowHeight < 680;
    const deityImageWidth = isExtraSmallScreen ? 72 : isSmallScreen ? 88 : 125;
    const deityImageHeight = isExtraSmallScreen ? 88 : isSmallScreen ? 108 : 148;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDeity, setSelectedDeity] = useState<DeityId | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const { data: apiDeities, isLoading: loading } = useDeities();

    const deities: DeityOption[] = useMemo(() => {
        if (!apiDeities || apiDeities.length === 0) return [];
        return apiDeities.map((d) => ({
            id: d.slug,
            nameKey: '',
            name: d.name,
            imageUrl: d.imageUrl,
        }));
    }, [apiDeities]);

    const getDeityDisplayName = (deity: DeityOption): string => {
        if (deity.name) {
            const lang = i18n.language;
            return deity.name[lang as keyof typeof deity.name] || deity.name.hi || deity.name.en;
        }
        return t(deity.nameKey);
    };

    const filteredDeities = useMemo(() => {
        if (!searchQuery.trim()) return deities;
        return deities.filter(d =>
            getDeityDisplayName(d).toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, deities, i18n.language]);

    const renderCardContent = (deity: DeityOption, isSelected: boolean) => {
        return (
            <>
                {/* Deity Image */}
                {deity.imageUrl ? (
                    <CachedImage
                        uri={resolveImageUrl(deity.imageUrl)}
                        style={[styles.imageContainer, { width: deityImageWidth, height: deityImageHeight }]}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={[styles.imageContainer, { width: deityImageWidth, height: deityImageHeight }]} />
                )}

                {/* Text */}
                <View style={styles.nameBadge}>
                    <Text
                        style={[styles.nameText, isSelected && styles.nameTextSelected]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {getDeityDisplayName(deity)}
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
                                placeholder={t('deitySelectionScreen.search')}
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

                        {filteredDeities.map((deity) => {
                            const isSelected = selectedDeity === deity.id;

                            if (isSelected) {
                                return (
                                    <TouchableOpacity
                                        key={deity.id}
                                        style={[styles.card, styles.cardSelectedContainer]}
                                        onPress={() => setSelectedDeity(deity.id)}
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
                                            {renderCardContent(deity, isSelected)}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={deity.id}
                                    style={styles.card}
                                    onPress={() => setSelectedDeity(deity.id)}
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
                                        {renderCardContent(deity, isSelected)}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    )}
                </ScrollView>

                    {/* Footer Button */}
                    {selectedDeity && (
                        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                            <Button
                                title={t('deitySelectionScreen.continue')}
                                variant="primary"
                                fullWidth
                                onPress={() => {
                                    if (selectedDeity) {
                                        hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                        onContinue(selectedDeity);
                                    }
                                }}
                            />
                        </View>
                    )}
            </View>
        </KeyboardAvoidingView>
    );
};
