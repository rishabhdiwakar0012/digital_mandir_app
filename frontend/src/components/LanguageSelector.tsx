import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import * as hapticUtils from '../utils/hapticUtils';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface LanguageSelectorProps {
    onComplete: () => void;
}

type LanguageCode = 'hi' | 'en';

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onComplete }) => {
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
    const insets = useSafeAreaInsets();

    const handleLanguageSelect = (langCode: LanguageCode) => {
        setSelectedLanguage(langCode);
    };

    const handleContinue = () => {
        if (selectedLanguage) {
            hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
            console.log(`Selected language: ${selectedLanguage}`);
            onComplete();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
                {/* Character & Speech Bubble Area */}
                <View style={styles.illustrationArea}>
                    {/* Character Image */}
                    <Image
                        source={require('../../assets/language.png')}
                        style={styles.characterImage}
                        resizeMode="contain"
                    />

                    {/* Speech Bubble */}
                    <View style={styles.bubbleContainer}>
                        <View style={styles.bubble}>
                            <Text style={styles.bubbleTextTitle}>Select Language</Text>
                            <Text style={styles.bubbleTextSubtitle}>भाषा चुनें</Text>
                        </View>
                        {/* Triangle for speech bubble - pointing left */}
                        <View style={styles.bubbleArrow} />
                    </View>
                </View>

                {/* Language Options */}
                <View style={styles.languageList}>
                    {/* Hindi Option */}
                    <TouchableOpacity
                        style={[
                            styles.languageButton,
                            selectedLanguage === 'hi' && styles.languageButtonSelected
                        ]}
                        onPress={() => handleLanguageSelect('hi')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.languageLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FF9933' }]}>
                                <Text style={styles.hindiIconText}>ह</Text>
                            </View>
                            <Text style={styles.languageLabel}>Hindi</Text>
                        </View>
                        {/* Could add a radio button or checkmark here if desired, seemingly not present in screenshot but common pattern */}
                    </TouchableOpacity>

                    {/* English Option */}
                    <TouchableOpacity
                        style={[
                            styles.languageButton,
                            selectedLanguage === 'en' && styles.languageButtonSelected
                        ]}
                        onPress={() => handleLanguageSelect('en')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.languageLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000' }]}>
                                <Text style={styles.englishIconText}>En</Text>
                            </View>
                            <Text style={styles.languageLabel}>English</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer / Continue Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedLanguage && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedLanguage}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>CONTINUE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        padding: 5,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    illustrationArea: {
        flexDirection: 'row',
        alignItems: 'center', // Align items vertically in center
        justifyContent: 'center', // Center content horizontally if needed, or flex-start
        marginBottom: 40,
        position: 'relative',
        height: 200, // Fixed height area for illustration
    },
    characterImage: {
        width: 120, // Adjust based on aspect ratio
        height: 160,
        marginRight: 10,
    },
    bubbleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Take remaining space
    },
    bubbleArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderRightWidth: 10, // Pointing left
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: '#fff', // Match bubble background
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        // Shadow trickery is hard with arrow, simplified.
        // To make it look perfect like screenshot might need a small SVG or image for exact bubble shape.
        // For now, placing arrow relative to bubble.
        position: 'absolute',
        left: -8, // pushed out to the left of the bubble
        zIndex: 10,
    },
    bubble: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginLeft: 0, // Arrow is absolutely positioned
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // For Android shadow
        borderWidth: 1,
        borderColor: '#EEEEEE',
        minWidth: 160,
    },
    bubbleTextTitle: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        marginBottom: 4,
    },
    bubbleTextSubtitle: {
        fontSize: 14,
        color: '#333',
        fontWeight: '400',
    },
    languageList: {
        width: '100%',
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 12, // Increased padding
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 72, // Fixed height for consistency
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    languageButtonSelected: {
        borderColor: '#FF9933', // Orange border when selected
        backgroundColor: '#FFF', // Keep white background or slight tint
        borderWidth: 2,
    },
    languageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24, // Circle for Hindi
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    // Specific styling for English icon (rounded square look from screenshot)
    // Actually the screenshot shows English as a square with rounded corners? 
    // Wait, the screenshot shows "En" inside a square with rounded corners and border.
    // Hindi is "ह" inside a filled orange circle (or rounded square with heavy rounding).
    // Let's adjust border radius for English specifically in inline style above (done).
    hindiIconText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4 // Adjust baseline
    },
    englishIconText: {
        color: '#000000',
        fontSize: 20,
        fontWeight: '600',
    },
    languageLabel: {
        fontSize: 18,
        color: '#333333',
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    continueButton: {
        backgroundColor: '#FF9933', // Primary Orange
        borderRadius: 12, // More rounded
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#FF9933',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonDisabled: {
        backgroundColor: '#E0E0E0', // Gray when disabled
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
