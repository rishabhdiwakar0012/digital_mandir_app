import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, Platform, Switch, StatusBar, Linking, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Typography } from '../../atoms';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows } from '../../../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../../i18n';
import { secureStorage } from '../../../utils/storage';
import { config } from '../../../config';
import { requestNotificationPermissions, getPushToken, getDeviceId, getDeviceInfo } from '../../../services/notificationService';
import { deviceApi } from '../../../api/services/deviceApi';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const LanguageSelectionDialog = ({ visible, onClose, currentLang, onSelect }: any) => {
    const { t } = useTranslation();
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.dialogOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={styles.dialogContainer}
                >
                    <View style={styles.dialogHeader}>
                        <Typography variant="h3" style={styles.dialogTitle}>{t('settingsScreen.selectLanguage')}</Typography>
                        <TouchableOpacity onPress={onClose} style={styles.dialogCloseButton}>
                            <Ionicons name="close" size={20} color="#757575" />
                        </TouchableOpacity>
                    </View>
                    <Typography variant="body2" style={styles.dialogSubtitle}>
                        {t('settingsScreen.chooseLanguage')}
                    </Typography>

                    <TouchableOpacity 
                        style={[styles.languageOption, currentLang === 'en' && styles.languageOptionSelected]}
                        onPress={() => onSelect('en')}
                    >
                        <View style={styles.languageOptionLeft}>
                            <View style={styles.languageIconBg}>
                                <Typography variant="h3" style={styles.languageIconText}>A</Typography>
                            </View>
                            <Typography variant="body1" style={styles.languageOptionText}>English</Typography>
                        </View>
                        {currentLang === 'en' && (
                            <Ionicons name="checkmark-circle" size={24} color="#FF9800" />
                        )}
                        {currentLang !== 'en' && (
                            <View style={styles.radioOutline} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.languageOption, currentLang === 'hi' && styles.languageOptionSelected]}
                        onPress={() => onSelect('hi')}
                    >
                        <View style={styles.languageOptionLeft}>
                            <View style={styles.languageIconBg}>
                                <Typography variant="h3" style={styles.languageIconText}>अ</Typography>
                            </View>
                            <Typography variant="body1" style={styles.languageOptionText}>हिंदी</Typography>
                        </View>
                        {currentLang === 'hi' && (
                            <Ionicons name="checkmark-circle" size={24} color="#FF9800" />
                        )}
                        {currentLang !== 'hi' && (
                            <View style={styles.radioOutline} />
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

interface CustomPopupProps {
    visible: boolean;
    title: string;
    message: React.ReactNode | string;
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const CustomPopupDialog: React.FC<CustomPopupProps> = ({ 
    visible, title, message, iconName = 'alert-circle', iconColor = '#FF9800', 
    confirmText, cancelText, isDestructive = false, 
    onClose, onConfirm 
}) => {
    const { t } = useTranslation();
    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.dialogOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.dialogContainer, styles.themePopupContainer]}>
                    <View style={[styles.popupIconCircle, { backgroundColor: isDestructive ? '#FFEBEE' : '#FFF3E0' }]}>
                        <Ionicons name={iconName} size={32} color={isDestructive ? '#F44336' : iconColor} />
                    </View>
                    <Typography variant="h3" style={styles.popupTitle}>{title}</Typography>
                    <Typography variant="body2" style={styles.popupMessage}>{message}</Typography>
                    
                    <View style={styles.popupButtonsRow}>
                        <TouchableOpacity
                            style={[
                                styles.popupConfirmBtn,
                                isDestructive ? styles.popupConfirmDestructive : styles.popupConfirmPrimary
                            ]}
                            onPress={() => {
                                onConfirm();
                                onClose();
                            }}
                        >
                            <Typography variant="h3" style={styles.popupConfirmText}>{confirmText || t('common.ok')}</Typography>
                        </TouchableOpacity>
                        {isDestructive && (
                            <TouchableOpacity style={styles.popupCancelBtn} onPress={onClose}>
                                <Typography variant="h3" style={styles.popupCancelText}>{cancelText || t('common.cancel')}</Typography>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const insets = useSafeAreaInsets();
    // With statusBarTranslucent on the Modal, insets.top is the real status bar height.
    const statusBarH = Platform.OS === 'ios'
        ? (insets.top > 0 ? insets.top : 44)
        : (insets.top > 0 ? insets.top : (StatusBar.currentHeight ?? 33));

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [hapticFeedback, setHapticFeedback] = useState(true);
    const { t, i18n } = useTranslation();
    const currentLanguageName = i18n.language === 'hi' ? 'हिंदी' : 'English';
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

    // Load persisted settings whenever the modal opens
    useEffect(() => {
        if (!visible) return;
        AsyncStorage.multiGet(['settings:sound', 'settings:notifications', 'settings:haptic'])
            .then(([sound, notifications, haptic]) => {
                if (sound[1] !== null) setSoundEnabled(sound[1] === 'true');
                if (notifications[1] !== null) setNotificationsEnabled(notifications[1] === 'true');
                if (haptic[1] !== null) setHapticFeedback(haptic[1] === 'true');
            })
            .catch(() => {});
    }, [visible]);

    const handleSoundChange = (val: boolean) => {
        setSoundEnabled(val);
        AsyncStorage.setItem('settings:sound', String(val)).catch(() => {});
    };
    const handleNotificationsChange = async (val: boolean) => {
        if (val) {
            // Request OS permission when turning ON
            const granted = await requestNotificationPermissions();
            if (!granted) {
                // Permission denied — open settings so user can enable manually
                Alert.alert(
                    t('settingsScreen.notificationsTitle', 'Enable Notifications'),
                    t('settingsScreen.notificationsPermissionDenied', 'Please enable notifications for Digital Mandir in your device Settings.'),
                    [
                        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                        { text: t('settingsScreen.openSettings', 'Open Settings'), onPress: () => Linking.openSettings() },
                    ]
                );
                return; // Don't flip the toggle if permission was denied
            }
            // Register device with fresh push token
            try {
                const pushToken = await getPushToken();
                const deviceId = await getDeviceId();
                const deviceInfo = getDeviceInfo();
                await deviceApi.registerDevice({
                    deviceId,
                    platform: deviceInfo.platform,
                    osVersion: deviceInfo.osVersion,
                    appVersion: deviceInfo.appVersion,
                    deviceModel: deviceInfo.deviceModel,
                    fcmToken: pushToken,
                });
            } catch (e) {
                console.warn('[Settings] Failed to re-register device on notifications enable:', e);
            }
        }
        setNotificationsEnabled(val);
        AsyncStorage.setItem('settings:notifications', String(val)).catch(() => {});
    };
    const handleHapticChange = (val: boolean) => {
        setHapticFeedback(val);
        AsyncStorage.setItem('settings:haptic', String(val)).catch(() => {});
    };

    const handleLanguageSelect = async (lang: string) => {
        await changeLanguage(lang);
        // Persist so the selection survives app restarts (same key as onboarding flow)
        await secureStorage.setItem(config.storage.languageKey, lang);
        setIsLanguageModalVisible(false);
    };

    const handleLanguagePress = () => {
        setIsLanguageModalVisible(true);
    };

    const [popupConfig, setPopupConfig] = useState<{
        visible: boolean;
        title: string;
        message: React.ReactNode | string;
        iconName?: keyof typeof Ionicons.glyphMap;
        iconColor?: string;
        confirmText?: string;
        cancelText?: string;
        isDestructive?: boolean;
        onConfirm?: () => void;
    }>({ visible: false, title: '', message: '' });

    const showInfoPopup = (title: string, message: React.ReactNode | string, iconName?: keyof typeof Ionicons.glyphMap) => {
        setPopupConfig({
            visible: true,
            title,
            message,
            iconName: iconName || 'information-circle',
            iconColor: '#FF9800',
            confirmText: t('common.ok'),
            isDestructive: false,
            onConfirm: () => {},
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                    bounces={false}
                >
                    {/* Header Gradient */}
                    <LinearGradient
                        colors={['#E65100', '#FF9800', '#FFB74D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.headerGradient, { height: 110 + statusBarH }]}
                    >
                        <View style={[styles.headerRow, { paddingTop: statusBarH + 14 }]}>
                            <TouchableOpacity onPress={onClose} style={styles.headerButton} activeOpacity={0.7}>
                                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Typography variant="h2" style={styles.headerTitle}>{t('settingsScreen.title')}</Typography>
                            <View style={styles.headerButtonPlaceholder} />
                        </View>
                    </LinearGradient>

                    {/* Content Section */}
                    <View style={styles.contentContainer}>

                        {/* App Appearance & General */}
                        <Typography variant="h3" style={styles.sectionTitle}>{t('settingsScreen.general')}</Typography>
                        <View style={styles.card}>
                            <SettingItem
                                icon="language-outline"
                                label={t('settingsScreen.language')}
                                value={currentLanguageName}
                                onPress={handleLanguagePress}
                            />
                            <View style={styles.divider} />
                            <SettingSwitch
                                icon="volume-high-outline"
                                label={t('settingsScreen.appSound')}
                                value={soundEnabled}
                                onValueChange={handleSoundChange}
                            />
                            <View style={styles.divider} />
                            <SettingSwitch
                                icon="phone-portrait-outline"
                                label={t('settingsScreen.hapticFeedback')}
                                value={hapticFeedback}
                                onValueChange={handleHapticChange}
                            />
                        </View>

                        {/* Notifications */}
                        <Typography variant="h3" style={styles.sectionTitle}>{t('settingsScreen.contentSpiritual')}</Typography>
                        <View style={styles.card}>
                            <SettingSwitch
                                icon="notifications-outline"
                                label={t('settingsScreen.dailyReminders')}
                                value={notificationsEnabled}
                                onValueChange={handleNotificationsChange}
                            />
                        </View>

                        {/* Account & Support */}
                        <Typography variant="h3" style={styles.sectionTitle}>{t('settingsScreen.accountSupport')}</Typography>
                        <View style={styles.card}>
                            <SettingItem
                                icon="shield-checkmark-outline"
                                label={t('settingsScreen.privacyPolicy')}
                                onPress={() => setPopupConfig({
                                    visible: true,
                                    title: t('settingsScreen.privacyPolicy'),
                                    message: t('settingsScreen.privacyInfo'),
                                    iconName: 'shield-checkmark-outline',
                                    iconColor: '#FF9800',
                                    confirmText: t('settingsScreen.readPrivacyPolicy'),
                                    cancelText: t('common.cancel'),
                                    isDestructive: true,
                                    onConfirm: () => Linking.openURL('https://digitalmandir.in/privacy-policy'),
                                })}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="help-circle-outline"
                                label={t('settingsScreen.helpSupport')}
                                onPress={() => Linking.openURL('mailto:support@digitalmandir.in?subject=Support%20Request%20-%20Digital%20Mandir')}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="star-outline"
                                label={t('settingsScreen.aboutDigitalMandir')}
                                onPress={() => showInfoPopup(
                                    t('settingsScreen.premiumExperience'),
                                    <React.Fragment>
                                        {t('settingsScreen.aboutDescription')}{"\n\n"}
                                        {t('settingsScreen.designedByPrefix')}<Text style={{ color: '#FF9800', textDecorationLine: 'underline', fontWeight: 'bold' }} onPress={() => Linking.openURL('https://zlaark.com')}>Zlaark</Text>{t('settingsScreen.designedBySuffix')}
                                    </React.Fragment>,
                                    "star"
                                )}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="information-circle-outline"
                                label={t('settingsScreen.appVersion')}
                                value="v1.0.0"
                                noChevron={true}
                                onPress={() => showInfoPopup(t('settingsScreen.appVersion'), `${t('settingsScreen.appNameVariant', 'Digital Mandir')} v1.0.0\n${t('settingsScreen.buildNumber')}100`, 'information-circle-outline')}
                            />
                        </View>

                        {/* Extra Settings could go here */}

                    </View>
                </ScrollView>
            </View>
            <LanguageSelectionDialog
                visible={isLanguageModalVisible}
                onClose={() => setIsLanguageModalVisible(false)}
                currentLang={i18n.language}
                onSelect={handleLanguageSelect}
            />
            <CustomPopupDialog
                visible={popupConfig.visible}
                title={popupConfig.title}
                message={popupConfig.message}
                iconName={popupConfig.iconName}
                iconColor={popupConfig.iconColor}
                confirmText={popupConfig.confirmText}
                cancelText={popupConfig.cancelText}
                isDestructive={popupConfig.isDestructive}
                onClose={() => setPopupConfig(p => ({ ...p, visible: false }))}
                onConfirm={() => popupConfig.onConfirm?.()}
            />
        </Modal>
    );
};

// ─── Reusable Components ────────────────────────────────────────────────────────

const SettingItem = ({ icon, label, value, onPress, noChevron = false, textStyle, iconColor, iconBgColor }: any) => (
    <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
    >
        <View style={[styles.settingIconBg, iconBgColor && { backgroundColor: iconBgColor }]}>
            <Ionicons name={icon} size={20} color={iconColor || "#FF9800"} />
        </View>
        <View style={styles.settingTextContainer}>
            <Typography variant="body1" style={[styles.settingLabel, textStyle]}>{label}</Typography>
        </View>
        {!!value && (
            <Typography variant="body2" style={styles.settingValueText}>{value}</Typography>
        )}
        {!noChevron && (
            <Ionicons name="chevron-forward" size={18} color="#E0E0E0" style={{ marginLeft: 8 }} />
        )}
    </TouchableOpacity>
);

const SettingSwitch = ({ icon, label, value, onValueChange }: any) => (
    <View style={styles.settingRow}>
        <View style={styles.settingIconBg}>
            <Ionicons name={icon} size={20} color="#FF9800" />
        </View>
        <View style={styles.settingTextContainer}>
            <Typography variant="body1" style={styles.settingLabel}>{label}</Typography>
        </View>
        <Switch
            trackColor={{ false: "#E0E0E0", true: "#FFB74D" }}
            thumbColor={value ? "#FF9800" : "#F5F5F5"}
            ios_backgroundColor="#E0E0E0"
            onValueChange={onValueChange}
            value={value}
        />
    </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    headerGradient: {
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...shadows.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    headerButtonPlaceholder: {
        width: 44,
        height: 44,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 0.5,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 14,
        textTransform: 'uppercase',
        color: '#757575',
        marginBottom: 12,
        marginLeft: 8,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 28,
        ...shadows.sm,
        shadowColor: '#000',
        shadowOpacity: 0.05,
    },
    divider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginLeft: 52, // Align with text
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    settingIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    settingLabel: {
        color: '#424242',
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
    },
    settingValueText: {
        color: '#9E9E9E',
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
    },
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dialogContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        padding: 24,
        ...shadows.lg,
    },
    dialogHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dialogTitle: {
        fontSize: 18,
        color: '#212121',
        fontFamily: 'Poppins_600SemiBold',
    },
    dialogCloseButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    dialogSubtitle: {
        color: '#757575',
        marginBottom: 24,
        fontSize: 13,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    languageOptionSelected: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FFE0B2',
    },
    languageOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    languageIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        ...shadows.sm,
    },
    languageIconText: {
        color: '#FF9800',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
    languageOptionText: {
        fontSize: 16,
        color: '#424242',
        fontFamily: 'Poppins_500Medium',
    },
    radioOutline: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    themePopupContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    popupIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    popupTitle: {
        fontSize: 20,
        color: '#212121',
        fontFamily: 'Poppins_600SemiBold',
        textAlign: 'center',
        marginBottom: 8,
    },
    popupMessage: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    popupButtonsRow: {
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        gap: 10,
    },
    popupCancelBtn: {
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupCancelText: {
        color: '#757575',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
    popupConfirmBtn: {
        paddingVertical: 12,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm,
    },
    popupConfirmPrimary: {
        backgroundColor: '#FF9800',
    },
    popupConfirmDestructive: {
        backgroundColor: '#F44336',
    },
    popupConfirmText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
});
