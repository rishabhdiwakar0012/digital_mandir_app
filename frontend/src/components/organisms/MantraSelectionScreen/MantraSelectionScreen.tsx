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
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as hapticUtils from '../../../utils/hapticUtils';
import { Assets } from '../../../theme';
import { DeityId } from '../GodSpecificScreen/GodSpecificScreen';
import { useMantras } from '../../../api/hooks/useContent';
import { ApiMantra } from '../../../api/services/contentApi';
import { Button } from '../../atoms/Button';
import { HeaderLogo } from '../../molecules';
import { styles } from './styles';

// Keep the Mantra interface for backwards compatibility with consumers
export interface Mantra {
    id: string;
    deityId?: DeityId;
    festivalId?: string;
    isSpecial?: boolean;
    titleSanskrit: string;
    titleHindi: string;
    text: string;
    meaning: string;
    audioUrl?: string;
}

export interface MantraSelectionScreenProps {
    onBack: () => void;
    onContinue: (mantra: Mantra) => void;
    selectedDeity?: DeityId;
    selectedFestival?: string;
    isSpecial?: boolean;
}

// Map API mantra to local Mantra shape
const mapApiMantra = (m: ApiMantra): Mantra => ({
    id: m._id,
    deityId: typeof m.deityId === 'object' && m.deityId ? m.deityId.slug : undefined,
    festivalId: m.festivalId,
    isSpecial: m.category === 'special',
    titleSanskrit: m.title?.sa || m.title?.hi || '',
    titleHindi: m.title?.hi || m.title?.en || '',
    text: m.text?.sa || m.text?.hi || m.text?.en || '',
    meaning: m.description?.en || m.description?.hi || '',
    audioUrl: m.audioUrl,
});

export const MantraSelectionScreen: React.FC<MantraSelectionScreenProps> = ({
    onBack,
    onContinue,
    selectedDeity,
    selectedFestival,
    isSpecial,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMantraId, setSelectedMantraId] = useState<string | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const queryParams = useMemo(() => {
        const params: { category?: string; deityId?: string; festivalId?: string } = {};
        if (isSpecial) {
            params.category = 'special';
        } else if (selectedDeity) {
            params.category = 'god';
        } else if (selectedFestival) {
            params.category = 'festival';
            params.festivalId = selectedFestival;
        }
        return params;
    }, [isSpecial, selectedDeity, selectedFestival]);

    const { data: apiMantras, isLoading: loading, isFetching } = useMantras(queryParams);

    const mantras: Mantra[] = useMemo(() => {
        if (!apiMantras) return [];
        let mapped = apiMantras.map(mapApiMantra);
        // Client-side filter by deity slug since backend deityId requires ObjectId
        if (selectedDeity && !isSpecial) {
            mapped = mapped.filter(m => m.deityId === selectedDeity);
        }
        return mapped;
    }, [apiMantras, selectedDeity, isSpecial]);

    // Filter by search query
    const filteredMantras = useMemo(() => {
        if (!searchQuery.trim()) return mantras;
        const lowerQuery = searchQuery.toLowerCase();
        return mantras.filter(m =>
            m.titleHindi.toLowerCase().includes(lowerQuery) ||
            m.titleSanskrit.includes(lowerQuery) ||
            m.text.includes(lowerQuery)
        );
    }, [searchQuery, mantras]);

    const selectedMantra = useMemo(() => {
        return mantras.find(m => m.id === selectedMantraId) || null;
    }, [selectedMantraId, mantras]);

    const renderCardContent = (mantra: Mantra, isSelected: boolean) => {
        return (
            <>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={[styles.mantraTitleSanskrit, isSelected && styles.mantraTitleSanskritSelected]}>
                            {mantra.titleSanskrit}
                        </Text>
                        <Text style={[styles.mantraTitleHindi, isSelected && styles.mantraTitleHindiSelected]}>
                            {mantra.titleHindi}
                        </Text>
                    </View>
                    {isSelected && (
                        <View style={styles.checkmarkContainer}>
                            <Ionicons name="checkmark" size={16} color="#D35400" />
                        </View>
                    )}
                </View>

                <Text style={[styles.mantraTextPreview, isSelected && styles.mantraTextPreviewSelected]} numberOfLines={2}>
                    {mantra.text}
                </Text>

                <Text style={[styles.mantraMeaning, isSelected && styles.mantraMeaningSelected]} numberOfLines={3}>
                    {mantra.meaning}
                </Text>
            </>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={{ flex: 1, backgroundColor: '#FFF8F0', paddingTop: insets.top + 20 }}>
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
                    <View style={{ backgroundColor: '#FFF8F0', paddingBottom: 16, marginHorizontal: -20, paddingHorizontal: 20, zIndex: 10 }}>
                        <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={isSearchFocused ? "#E65100" : "#8D6E63"}
                                style={{ marginRight: 8 }}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('mantraSelectionScreen.search', 'Search mantras')}
                                placeholderTextColor="#8D6E63"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </View>
                    </View>
                    <Text style={styles.sectionTitle}>
                        {t('mantraSelectionScreen.chooseMantra', 'Choose your Mantra')}
                    </Text>

                    <View style={styles.mantraList}>
                        {loading ? (
                            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                                <ActivityIndicator size="large" color="#D35400" />
                            </View>
                        ) : filteredMantras.length === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateText}>
                                    {t('mantraSelectionScreen.noMantrasFound', 'No mantras found.')}
                                </Text>
                            </View>
                        ) : (
                            filteredMantras.map((mantra) => {
                                const isSelected = selectedMantraId === mantra.id;

                                if (isSelected) {
                                    return (
                                            <TouchableOpacity
                                                key={mantra.id}
                                                style={[styles.card, styles.cardSelectedContainer]}
                                                onPress={() => setSelectedMantraId(mantra.id)}
                                                activeOpacity={0.9}
                                            >
                                                <LinearGradient
                                                    colors={['#D35400', '#E67E22', '#F39C12']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={styles.cardGradient}
                                                >
                                                    <View style={styles.cardImageContainer}>
                                                        <Image
                                                            source={Assets.cardBackground}
                                                            style={[
                                                                styles.cardBackgroundImage,
                                                                styles.cardBackgroundImageSelected,
                                                                { tintColor: '#FFFFFF' }
                                                            ]}
                                                            resizeMode="contain"
                                                        />
                                                    </View>
                                                    {renderCardContent(mantra, isSelected)}
                                                </LinearGradient>
                                            </TouchableOpacity>
                                    );
                                }

                                return (
                                    <TouchableOpacity
                                        key={mantra.id}
                                        style={styles.card}
                                        onPress={() => setSelectedMantraId(mantra.id)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardImageContainer}>
                                                <Image
                                                    source={Assets.cardBackground}
                                                    style={[
                                                        styles.cardBackgroundImage,
                                                        { tintColor: '#D4AF37' }
                                                    ]}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            {renderCardContent(mantra, isSelected)}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </ScrollView>

                {/* Footer Button - visible immediately when a mantra is selected */}
                {selectedMantraId && selectedMantra && (
                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <Button
                            title={t('mantraSelectionScreen.continue', 'CONTINUE')}
                            variant="primary"
                            fullWidth
                            onPress={() => {
                                hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                // Prefer fresh API data if available, otherwise use the
                                // already-mapped mantra — either way the button is always active.
                                const freshApiMantra = apiMantras?.find(m => m._id === selectedMantraId);
                                const mantraToPass = freshApiMantra ? mapApiMantra(freshApiMantra) : selectedMantra;
                                onContinue(mantraToPass);
                            }}
                        />
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};
