import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as hapticUtils from '../../../utils/hapticUtils';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';
import { LANGUAGE_CONFIG } from './constants';
import { Assets } from '../../../theme';
import { TypewriterText } from '../../atoms/TypewriterText';
import { ChatBubble } from '../../atoms/ChatBubble';
import { Button } from '../../atoms/Button';

interface LanguageSelectorProps {
    onSelectLanguage: (language: string) => void;
    onBack: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    onSelectLanguage,
    onBack
}) => {
    const { t } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const { height } = useWindowDimensions();
    const isSmallScreen = height < 700;
    const isExtraSmallScreen = height < 680;

    const illustrationWidth = isExtraSmallScreen ? 90 : isSmallScreen ? 100 : 120;
    const illustrationHeight = isExtraSmallScreen ? 120 : isSmallScreen ? 135 : 160;

    const handleLanguageSelect = (langId: string) => {
        setSelectedLanguage(langId);
    };

    const handleContinue = () => {
        if (selectedLanguage) {
            hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
            onSelectLanguage(selectedLanguage);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                {/* Header - scrolls with content */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#757575" />
                    </TouchableOpacity>
                    <View style={styles.headerLogoContainer}>
                        <Image source={Assets.splashLogo} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.headerText}>DigitalMandir.in</Text>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    {/* Illustration with Bubble */}
                    <View style={styles.illustrationArea}>
                        <Image
                            source={Assets.signupImage}
                            style={[
                                styles.image,
                                {
                                    width: illustrationWidth,
                                    height: illustrationHeight
                                }
                            ]}
                            resizeMode="contain"
                        />

                        <ChatBubble style={styles.bubbleContainer}>
                            <TypewriterText
                                text={`Select Language\nभाषा चुनें`}
                                style={styles.bubbleTitle}
                                speed={35}
                                delay={400}
                            />
                        </ChatBubble>
                    </View>

                    {/* Language Options */}
                    <View style={styles.languageList}>
                        {LANGUAGE_CONFIG.languages.map((lang) => {
                            const isSelected = selectedLanguage === lang.id;

                            return (
                                <Pressable
                                    key={lang.id}
                                    style={[
                                        styles.languageOption,
                                        isSelected && styles.selectedOption
                                    ]}
                                    onPress={() => handleLanguageSelect(lang.id)}
                                >
                                    <View style={[
                                        styles.iconContainer,
                                        lang.id === 'hi' ? styles.hindiIcon : styles.englishIcon,
                                        isSelected && { borderColor: 'transparent' }
                                    ]}>
                                        <Text style={styles.iconText}>{lang.iconText}</Text>
                                    </View>
                                    <Text style={[
                                        styles.languageName,
                                        isSelected && styles.selectedOptionText
                                    ]}>
                                        {lang.name}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Footer with Continue Button */}
            <View style={styles.footer}>
                <Button
                    title={t('languageSelector.button')}
                    variant="primary"
                    fullWidth
                    onPress={handleContinue}
                    disabled={!selectedLanguage}
                />
            </View>
        </View>
    );
};

