import React, { useState, useEffect } from 'react';
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
    ActivityIndicator
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
import { secureStorage } from '../../../utils/storage';

export interface CustomMantraScreenProps {
    onBack: () => void;
    onContinue: (mantraText: string) => void;
}

interface CustomMantra {
    id: string;
    text: string;
    createdAt: number;
}

const CUSTOM_MANTRAS_KEY = 'custom_mantras';

export const CustomMantraScreen: React.FC<CustomMantraScreenProps> = ({
    onBack,
    onContinue,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [mode, setMode] = useState<'list' | 'create'>('list');
    const [savedMantras, setSavedMantras] = useState<CustomMantra[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [customMantra, setCustomMantra] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [selectedMantraId, setSelectedMantraId] = useState<string | null>(null);

    useEffect(() => {
        loadMantras();
    }, []);

    const loadMantras = async () => {
        try {
            const data = await secureStorage.getObject<CustomMantra[]>(CUSTOM_MANTRAS_KEY);
            if (data && data.length > 0) {
                setSavedMantras(data);
                setMode('list');
            } else {
                setMode('create');
            }
        } catch (error) {
            console.error('Failed to load custom mantras', error);
            setMode('create');
        } finally {
            setIsLoading(false);
        }
    };


    const handleDelete = async (id: string) => {
        const updatedMantras = savedMantras.filter(m => m.id !== id);
        try {
            await secureStorage.setObject(CUSTOM_MANTRAS_KEY, updatedMantras);
            setSavedMantras(updatedMantras);
            if (selectedMantraId === id) setSelectedMantraId(null);
        } catch (error) {
            console.error('Failed to delete custom mantra', error);
        }
    };

    const handleSave = async () => {
        const trimmed = customMantra.trim();
        if (trimmed.length > 0) {
            const newMantra: CustomMantra = {
                id: Date.now().toString(),
                text: trimmed,
                createdAt: Date.now(),
            };
            const updatedMantras = [newMantra, ...savedMantras];
            try {
                await secureStorage.setObject(CUSTOM_MANTRAS_KEY, updatedMantras);
                setSavedMantras(updatedMantras);
                setCustomMantra('');
                setMode('list');
            } catch (error) {
                console.error('Failed to save custom mantra', error);
            }
        }
    };

    const isInputValid = customMantra.trim().length > 0;

    const renderListContent = () => {
        return (
            <View style={[styles.contentContainer, { paddingHorizontal: 16 }]}>
                <Text style={[styles.titleText, { textAlign: 'left', marginBottom: 4 }]}>
                    {t('customMantraScreen.title', 'Your Custom Mantras')}
                </Text>
                <Text style={[styles.subtitleText, { textAlign: 'left', marginBottom: 12 }]}>
                    {t('customMantraScreen.subtitle', 'Select a mantra to practice or create a new one.')}
                </Text>
                <View style={{ alignItems: 'flex-start', marginBottom: 24 }}>
                    <TouchableOpacity
                        style={styles.addNewButton}
                        onPress={() => setMode('create')}
                    >
                        <Text style={styles.addNewButtonText}>{t('customMantraScreen.addNew', '+ Add New Mantra')}</Text>
                    </TouchableOpacity>
                </View>

                {savedMantras.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>
                            {t('customMantraScreen.noMantras', "You haven't added any custom mantras yet.")}
                        </Text>
                    </View>
                ) : (
                    savedMantras.map((mantra) => {
                        const isSelected = selectedMantraId === mantra.id;
                        return (
                            <View key={mantra.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.listItem, 
                                        isSelected ? styles.listItemSelectedContainer : {},
                                        { flex: 1, marginBottom: 0 }
                                    ]}
                                    onPress={() => setSelectedMantraId(isSelected ? null : mantra.id)}
                                    activeOpacity={isSelected ? 0.9 : 0.7}
                                >
                                    {isSelected ? (
                                        <LinearGradient
                                            colors={['#D35400', '#E67E22', '#F39C12']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.listItemSelectedGradient}
                                        >
                                            <Text style={styles.listItemTextSelected} numberOfLines={3}>
                                                {mantra.text}
                                            </Text>
                                            <View style={styles.checkmarkContainer}>
                                                <Ionicons name="checkmark" size={16} color="#D35400" />
                                            </View>
                                        </LinearGradient>
                                    ) : (
                                        <Text style={styles.listItemText} numberOfLines={3}>
                                            {mantra.text}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                                
                            </View>
                        );
                    })
                )}
            </View>
        );
    };

    const renderCreateContent = () => {
        return (
            <>
                <View style={styles.contentContainer}>
                    <Text style={styles.titleText}>
                        {t('customMantraScreen.createTitle', 'Bring Your Own Mantra')}
                    </Text>
                    <Text style={styles.subtitleText}>
                        {t('customMantraScreen.createSubtitle', 'Type your personal invocation or prayer here. We will help you keep track of your spiritual practice.')}
                    </Text>

                    <View style={[
                        styles.inputContainer,
                        isFocused && styles.inputContainerFocused
                    ]}>
                        <TextInput
                            style={styles.textInput}
                            placeholder={t('customMantraScreen.placeholder', 'E.g., ॐ तत् सतो...')}
                            placeholderTextColor="#BCAAA4"
                            value={customMantra}
                            onChangeText={setCustomMantra}
                            multiline={true}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoCorrect={false}
                            maxLength={500}
                            scrollEnabled={false}
                        />
                    </View>
                </View>

                {/* Footer Button for Create Mode */}
                <View style={[styles.footer, { paddingBottom: 16, marginTop: 20 }]}>
                    <Button
                        title={t('customMantraScreen.save', 'SAVE MANTRA')}
                        variant="primary"
                        fullWidth
                        disabled={!isInputValid}
                        onPress={handleSave}
                    />
                </View>

                {savedMantras.length > 0 && (
                    <View style={[styles.contentContainer, { paddingHorizontal: 16, marginTop: 32 }]}>
                        <Text style={[styles.titleText, { textAlign: 'left', fontSize: 18, marginBottom: 16 }]}>Saved Mantras</Text>
                        {savedMantras.map((mantra) => (
                            <View key={mantra.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <View style={[styles.listItem, { flex: 1, marginBottom: 0 }]}>
                                    <Text style={styles.listItemText} numberOfLines={3}>
                                        {mantra.text}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => handleDelete(mantra.id)}
                                    style={{ padding: 12, marginLeft: 8, backgroundColor: '#FFEBEE', borderRadius: 8 }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </>

        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#E65100" />
            </View>
        );
    }

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
                        keyboardDismissMode="on-drag"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header Content */}
                        <View style={styles.headerTopContent}>
                            <HeaderLogo />
                        </View>

                        {mode === 'list' ? renderListContent() : renderCreateContent()}
                    </ScrollView>

                    {/* Footer Button - only visible when an option is selected in list mode */}
                    {mode === 'list' && selectedMantraId && (
                        <View style={[styles.footer, { paddingVertical: 8, paddingBottom: Math.max(insets.bottom, 8) }]}>
                            <Button
                                title={t('customMantraScreen.continue', 'CONTINUE')}
                                variant="primary"
                                fullWidth
                                onPress={() => {
                                    hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
                                    const selected = savedMantras.find(m => m.id === selectedMantraId);
                                    if (selected) onContinue(selected.text);
                                }}
                            />
                        </View>
                    )}
                </View>
        </KeyboardAvoidingView>
    );
};
