import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { Typography } from '../../atoms';
import { useColors } from '../../../theme';
import { useCurrentUser, useLogout } from '../../../api/hooks/useAuth';
import { useDeities } from '../../../api/hooks/useContent';
import { useAuthStore } from '../../../store/authStore';
import { EditProfileModal } from './EditProfileModal';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { LogoutDialog } from './LogoutDialog';
import { SettingsModal } from './SettingsModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { shadows } from '../../../theme/tokens';
import { useTranslation } from 'react-i18next';
import { getFullImageUrl } from '../../../utils';

export const ProfileScreen = () => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const { data, isLoading, error } = useCurrentUser();
    const { mutate: logout } = useLogout();
    const storeUser = useAuthStore((s) => s.user);
    const { t, i18n } = useTranslation();
    const { data: deities } = useDeities();

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const [isLogoutDialogVisible, setIsLogoutDialogVisible] = useState(false);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Prefer the fresh Zustand store (immediately updated after save) over stale cache
    const profile = storeUser || (data as any)?.profile || (data as any)?.user || data;

    const getFavoriteDeityDetails = React.useMemo(() => {
        if (!profile?.favoriteDeity) return { name: null, imageUrl: null };
        const deity = deities?.find(d => d._id === profile.favoriteDeity || d.name?.en === profile.favoriteDeity);
        if (!deity) return { name: profile.favoriteDeity, imageUrl: null };
        return { 
            name: deity.name[i18n.language as keyof typeof deity.name] || deity.name.en,
            imageUrl: deity.imageUrl 
        };
    }, [profile?.favoriteDeity, deities, i18n.language]);

    const favoriteDeityName = getFavoriteDeityDetails.name;

    React.useEffect(() => {
        setImageError(false);
    }, [profile?.avatar]);

    if (isLoading && !profile) {
        return (
            <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <Typography variant="body1" style={{ color: colors.error }}>
                    {t('common.error')}
                </Typography>
            </SafeAreaView>
        );
    }

    const displayName = profile.firstName || profile.lastName
        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        : profile.username || 'Spiritual Seeker';

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#E65100', '#FF9800', '#FFB74D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 5 }}
                style={{ height: insets.top, width: '100%', position: 'absolute', top: 0, zIndex: 100 }}
            />
            <SafeAreaView edges={['left', 'right']} style={styles.container}>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Immersive Header Background — inside ScrollView so it scrolls with content */}
                <LinearGradient
                    colors={['#E65100', '#FF9800', '#FFB74D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.headerGradient, { height: 140 + insets.top }]}
                >
                    <View style={[styles.headerPatternRow, { paddingTop: insets.top + 16, justifyContent: 'space-between', paddingHorizontal: 20 }]}>
                        <View style={{ width: 44 }} />
                        <Typography variant="h2" style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>{t('profileScreen.title')}</Typography>
                        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={() => setIsSettingsVisible(true)}>
                            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
                {/* Floating Profile Card */}
                <View
                    style={styles.floatingCard}
                >


                    <View style={styles.avatarRingContainer}>
                        <View style={styles.avatarWrapper}>
                            {profile.avatar && !imageError ? (
                                <Image 
                                    source={{ uri: getFullImageUrl(profile.avatar) }} 
                                    style={styles.avatar} 
                                    onError={() => setImageError(true)} 
                                />
                            ) : (
                                <View style={[styles.placeholderAvatar, { backgroundColor: profile.gender?.toLowerCase() === 'female' ? '#FFB6C1' : '#ADD8E6' }]}>
                                    <Typography variant="h1" style={[styles.placeholderText, { fontSize: 45, lineHeight: 50 }]}>
                                        {profile.gender?.toLowerCase() === 'female' ? '👧' : '👦'}
                                    </Typography>
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.editAvatarBadge}
                                activeOpacity={0.8}
                                onPress={() => setIsEditModalVisible(true)}
                            >
                                <Ionicons name="camera" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Typography variant="h2" style={styles.nameText}>{displayName}</Typography>
                    <Typography variant="body2" style={styles.emailText}>{profile.email}</Typography>

                    {profile.bio ? (
                        <Typography variant="body2" style={styles.bioText} numberOfLines={2}>
                            "{profile.bio}"
                        </Typography>
                    ) : null}

                    <TouchableOpacity
                        style={styles.editProfileButton}
                        activeOpacity={0.7}
                        onPress={() => setIsEditModalVisible(true)}
                    >
                        <Typography variant="body2" style={styles.editProfileText}>{t('profileScreen.editProfile')}</Typography>
                    </TouchableOpacity>
                </View>

                {/* Personal Information Section */}
                <View style={styles.sectionContainer}>
                    <Typography variant="h3" style={styles.sectionTitle}>{t('profileScreen.personalDetails')}</Typography>
                    <View style={styles.infoCard}>
                        <InfoRow
                            icon="person-outline"
                            label={t('profileScreen.fullName')}
                            value={profile.firstName || profile.lastName ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : (profile.username || t('profileScreen.notProvided'))}
                            noChevron
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon={profile.gender?.toLowerCase() === 'male' ? 'man' : profile.gender?.toLowerCase() === 'female' ? 'woman' : 'male-female'}
                            label={t('profileScreen.gender')}
                            value={profile.gender ? (profile.gender.toLowerCase() === 'male' ? t('profileScreen.male') : profile.gender.toLowerCase() === 'female' ? t('profileScreen.female') : profile.gender.toLowerCase() === 'other' ? t('profileScreen.other') : profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)) : t('profileScreen.notProvided')}
                            noChevron
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="calendar-outline"
                            label={t('profileScreen.dob')}
                            value={profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : t('profileScreen.notProvided')}
                            noChevron
                        />
                    </View>
                </View>

                {/* Spiritual Profile Section */}
                <View style={styles.sectionContainer}>
                    <Typography variant="h3" style={styles.sectionTitle}>{t('profileScreen.spiritualProfile')}</Typography>
                    <View style={styles.infoCard}>
                        <InfoRow
                            icon="rose-outline"
                            imageUrl={getFavoriteDeityDetails.imageUrl}
                            label={t('profileScreen.favoriteDeity')}
                            value={favoriteDeityName || t('profileScreen.notSelected')}
                            noChevron
                        />
                        <View style={styles.divider} />
                        <InfoRow
                            icon="time-outline"
                            label={t('profileScreen.memberSince')}
                            value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : t('profileScreen.recentlyJoined')}
                            noChevron
                        />
                    </View>
                </View>

                {/* Account Settings Section */}
                <View style={styles.sectionContainer}>
                    <Typography variant="h3" style={styles.sectionTitle}>{t('profileScreen.account')}</Typography>
                    <View style={styles.infoCard}>
                        <TouchableOpacity style={styles.actionRow} onPress={() => setIsSettingsVisible(true)} activeOpacity={0.7}>
                            <View style={styles.actionIconBg}>
                                <Ionicons name="settings-outline" size={20} color="#757575" />
                            </View>
                            <Typography variant="body1" style={styles.actionText}>{t('profileScreen.settings')}</Typography>
                            <Ionicons name="chevron-forward" size={18} color="#E0E0E0" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.actionRow} onPress={() => setIsLogoutDialogVisible(true)} activeOpacity={0.7}>
                            <View style={styles.actionIconBg}>
                                <Ionicons name="log-out-outline" size={20} color="#757575" />
                            </View>
                            <Typography variant="body1" style={styles.actionText}>{t('profileScreen.logout')}</Typography>
                            <Ionicons name="chevron-forward" size={18} color="#E0E0E0" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.actionRow} onPress={() => setIsDeleteDialogVisible(true)} activeOpacity={0.7}>
                            <View style={[styles.actionIconBg, { backgroundColor: '#FFEBEE' }]}>
                                <Ionicons name="trash-outline" size={20} color="#E53935" />
                            </View>
                            <Typography variant="body1" style={styles.deleteText}>{t('profileScreen.deleteAccount')}</Typography>
                            <Ionicons name="chevron-forward" size={18} color="#E0E0E0" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Version Footer */}
                <Typography variant="caption" style={styles.appVersionText}>
                    Digital Mandir v1.0.0
                </Typography>

            </ScrollView>

            <EditProfileModal
                visible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                profile={profile}
            />
            <SettingsModal
                visible={isSettingsVisible}
                onClose={() => setIsSettingsVisible(false)}
            />
            <LogoutDialog
                visible={isLogoutDialogVisible}
                onClose={() => setIsLogoutDialogVisible(false)}
            />
            <DeleteAccountDialog
                visible={isDeleteDialogVisible}
                onClose={() => setIsDeleteDialogVisible(false)}
            />
        </SafeAreaView>
        </View>
    );
};



// ─── Reusable Components ────────────────────────────────────────────────────────

const InfoRow = ({ icon, imageUrl, label, value, noChevron = false }: { icon: keyof typeof Ionicons.glyphMap, imageUrl?: string | null, label: string, value: string, noChevron?: boolean }) => (
    <View style={styles.infoRowContainer}>
        {imageUrl ? (
            <Image 
                source={{ uri: getFullImageUrl(imageUrl) }} 
                style={[styles.infoIconBg, { padding: 0, backgroundColor: 'transparent' }]} 
            />
        ) : (
            <View style={styles.infoIconBg}>
                <Ionicons name={icon} size={20} color="#FF9800" />
            </View>
        )}
        <View style={styles.infoTextContainer}>
            <Typography variant="caption" style={styles.infoLabel}>{label}</Typography>
            <Typography variant="body1" style={styles.infoValue}>{value}</Typography>
        </View>
        {!noChevron && (
            <Ionicons name="chevron-forward" size={16} color="#E0E0E0" />
        )}
    </View>
);

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Premium off-white
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerGradient: {
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerPatternRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 0.5,
        flex: 1,
        textAlign: 'center',
    },
    headerIconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    scrollContent: {
        paddingTop: 0, // Gradient is first child, no top padding needed
        paddingHorizontal: 0,
    },
    floatingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        ...shadows.lg,
        shadowColor: '#FF9800',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        marginTop: -32,   // Overlap the gradient bottom edge
        marginBottom: 32,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,152,0,0.1)',
    },
    coinsContainer: {
        position: 'absolute',
        top: 24,
        right: 24,
        alignItems: 'center',
    },
    coinIcon: {
        width: 24,
        height: 24,
        marginBottom: 4,
    },
    coinsValue: {
        color: '#212121',
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        lineHeight: 22,
    },
    coinsLabel: {
        color: '#9E9E9E',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    avatarRingContainer: {
        marginTop: -60,  // same visual pull-up as avatarWrapper had
        marginBottom: 16,
    },
    avatarWrapper: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: 56,
        padding: 4,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        // removed border as we moved it to padding on wrapper
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#FF9800',
        fontSize: 40,
        lineHeight: 48,
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 4,
        right: 0,
        backgroundColor: '#FF9800',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        ...shadows.sm,
    },
    nameText: {
        color: '#212121',
        fontSize: 22,
        marginBottom: 2,
        textAlign: 'center',
    },
    emailText: {
        color: '#757575',
        fontSize: 14,
        marginBottom: 12,
        fontFamily: 'Poppins_400Regular',
    },
    bioText: {
        color: '#616161',
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    editProfileButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#FFF3E0',
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    editProfileText: {
        color: '#FB8C00',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 13,
    },
    sectionContainer: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#424242',
        marginBottom: 12,
        marginLeft: 8,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 0.2,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        ...shadows.sm,
        shadowColor: '#000',
        shadowOpacity: 0.05,
    },
    divider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginLeft: 44, // Align with text, skipping icon
    },
    infoRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    infoIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    infoLabel: {
        color: '#9E9E9E',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoValue: {
        color: '#212121',
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    actionIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionText: {
        flex: 1,
        color: '#424242',
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
    },
    deleteText: {
        flex: 1,
        color: '#E53935',
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
    },
    appVersionText: {
        textAlign: 'center',
        color: '#BDBDBD',
        marginTop: 16,
        marginBottom: 32,
        fontFamily: 'Poppins_400Regular',
    }
});
