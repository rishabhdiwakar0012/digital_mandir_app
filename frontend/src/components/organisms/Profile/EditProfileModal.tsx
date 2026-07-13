import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Image, TextInput as RNTextInput, StatusBar, Alert } from 'react-native';
import { Typography, ErrorDialog } from '../../atoms';
import { GradientInputBorder } from '../../atoms/GradientInputBorder';
import { UserProfile } from '../../../types';
import { useUpdateProfile, useSendEmailOtp, useVerifyEmailOtp, useUpdateEmail, useVerifyEmailOtpRaw } from '../../../api/hooks/useAuth';
import { authApi } from '../../../api/services';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows } from '../../../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useDeities } from '../../../api/hooks/useContent';
import { useTranslation } from 'react-i18next';
import { getFullImageUrl } from '../../../utils';
interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    profile: UserProfile;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, profile }) => {
    const insets = useSafeAreaInsets();
    const statusBarH = Platform.OS === 'ios'
        ? (insets.top > 0 ? insets.top : 44)
        : (insets.top > 0 ? insets.top : (StatusBar.currentHeight ?? 33));
    const { mutate: updateProfile, isPending } = useUpdateProfile();
    const { data: deities, isLoading: isDeitiesLoading } = useDeities();
    const { t, i18n } = useTranslation();

    const genderOptions = [
        { label: t('registerScreen.female'), value: 'female', icon: 'woman' },
        { label: t('registerScreen.male'), value: 'male', icon: 'man' },
        { label: t('registerScreen.other'), value: 'other', icon: 'male-female' }
    ];

    const getGenderLabel = (genderValue: string) => {
        const option = genderOptions.find(opt => opt.value === genderValue?.toLowerCase());
        return option ? option.label : '';
    };

    useEffect(() => {
        if (visible) {
            StatusBar.setBarStyle('light-content', true);
            if (Platform.OS === 'android') {
                StatusBar.setBackgroundColor('transparent', true);
                StatusBar.setTranslucent(true);
            }
        }
        return () => {
            if (!visible) return;
            StatusBar.setBarStyle('light-content', true);
        };
    }, [visible]);

    const [firstName, setFirstName] = useState(profile.firstName || '');
    const [lastName, setLastName] = useState(profile.lastName || '');
    const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [gender, setGender] = useState(profile.gender || '');
    const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth || '');
    const [favoriteDeity, setFavoriteDeity] = useState(profile.favoriteDeity || '');
    const [email, setEmail] = useState(profile.email || '');

    const getFavoriteDeityDetails = React.useMemo(() => {
        if (!favoriteDeity) return { name: '', imageUrl: null };
        const deity = deities?.find(d => d._id === favoriteDeity || d.name?.en === favoriteDeity);
        if (!deity) return { name: favoriteDeity, imageUrl: null };
        return {
            name: deity.name[i18n.language as keyof typeof deity.name] || deity.name.en,
            imageUrl: deity.imageUrl
        };
    }, [favoriteDeity, deities, i18n.language]);

    const favoriteDeityName = getFavoriteDeityDetails.name;

    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [dobDay, setDobDay] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobYear, setDobYear] = useState('');
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Email Update State
    const [emailStep, setEmailStep] = useState<'IDLE' | 'confirm' | 'current-otp' | 'new-email' | 'new-otp'>('IDLE');
    const [emailOtp, setEmailOtp] = useState('');
    const [newEmailEntry, setNewEmailEntry] = useState('');
    const [showEmailConfirm, setShowEmailConfirm] = useState(false);
    
    const sendEmailOtp = useSendEmailOtp();
    const verifyEmailOtpRaw = useVerifyEmailOtpRaw();
    const updateEmailMutation = useUpdateEmail();

    // OTP inline error & resend state (separate from global errorMessage)
    const [otpError, setOtpError] = useState<string | null>(null);
    const [isResendingOtp, setIsResendingOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0); // Countdown in seconds

    // OTP Box Refs
    const otpRefs = React.useRef<Array<RNTextInput | null>>([]);
    const [activeOtpIndex, setActiveOtpIndex] = useState<number | null>(null);

    // Cooldown timer effect
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Auto-focus OTP input when emailStep changes
    useEffect(() => {
        if (emailStep === 'current-otp' || emailStep === 'new-otp') {
            const focusInput = () => {
                if (otpRefs.current && otpRefs.current[0]) {
                    otpRefs.current[0].focus();
                }
            };
            
            // Multi-attempt focus to bypass keyboard hide animations
            const t1 = setTimeout(focusInput, 100);
            const t2 = setTimeout(focusInput, 400);
            const t3 = setTimeout(focusInput, 800);
            
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }
    }, [emailStep]);

    const handleOtpChange = (text: string, index: number) => {
        // Clear inline OTP error as soon as user starts re-entering
        if (otpError) setOtpError(null);

        // Handle paste or multi-character input
        if (text.length > 1) {
            const pastedData = text.trim().slice(0, 6 - index).split('');
            const currentOtp = emailOtp.split('');
            // Ensure we have a base to work with
            while (currentOtp.length < 6) currentOtp.push('');

            for (let i = 0; i < pastedData.length; i++) {
                if (index + i < 6) {
                    currentOtp[index + i] = pastedData[i];
                }
            }
            
            const finalOtp = currentOtp.join('').slice(0, 6);
            setEmailOtp(finalOtp);
            
            // Focus the last filled box or the one after
            const nextIndex = Math.min(index + pastedData.length, 5);
            otpRefs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = emailOtp.split('');
        // Fill short array with spaces if needed
        while (newOtp.length < 6) newOtp.push('');
        
        if (text.length > 0) {
            newOtp[index] = text;
            setEmailOtp(newOtp.join('').slice(0, 6));
            if (index < 5) {
                otpRefs.current[index + 1]?.focus();
            }
        } else {
            newOtp[index] = '';
            setEmailOtp(newOtp.join('').slice(0, 6));
        }
    };

    const handleResendOtp = () => {
        setIsResendingOtp(true);
        setOtpError(null);
        setEmailOtp('');
        setResendCooldown(60); // Disable button immediately before API call
        const resendParams = emailStep === 'current-otp'
            ? { email: profile.email, purpose: 'login' as const, language: i18n.language }
            : { email: newEmailEntry, purpose: 'update-email' as const };
        sendEmailOtp.mutate(resendParams, {
            onSuccess: () => {
                setIsResendingOtp(false);
                setOtpError(null);
                // Focus first box after resend
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
            },
            onError: (err: any) => {
                setIsResendingOtp(false);
                if (err?.statusCode === 400 && err?.message?.includes('wait')) {
                    setOtpError('Please wait before resending OTP');
                } else {
                    setResendCooldown(0); // Allow retry on non-rate-limit errors
                    setErrorMessage(err.message || 'Failed to resend OTP');
                }
            },
        });
    };

    const handleOtpKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (emailOtp[index] === '' || emailOtp[index] === undefined) {
                if (index > 0) {
                    otpRefs.current[index - 1]?.focus();
                    const newOtp = emailOtp.split('');
                    while (newOtp.length < 6) newOtp.push('');
                    newOtp[index - 1] = '';
                    setEmailOtp(newOtp.join('').slice(0, 6));
                }
            } else {
                const newOtp = emailOtp.split('');
                while (newOtp.length < 6) newOtp.push('');
                newOtp[index] = '';
                setEmailOtp(newOtp.join('').slice(0, 6));
            }
        }
    };

    /**
     * Render 6-digit OTP input boxes
     */
    const renderOtpInput = () => {
        const otpArray = emailOtp.split('');
        while (otpArray.length < 6) otpArray.push('');

        return (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 20, width: '100%' }}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <RNTextInput
                        key={i}
                        ref={(ref) => { otpRefs.current[i] = ref; }}
                        style={{
                            width: 42,
                            height: 50,
                            borderWidth: activeOtpIndex === i ? 2 : 1,
                            borderColor: activeOtpIndex === i ? '#FF9800' : '#E0E0E0',
                            borderRadius: 12,
                            backgroundColor: '#FAFAFA',
                            textAlign: 'center',
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: '#333',
                            elevation: 1,
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otpArray[i]}
                        onChangeText={(text) => handleOtpChange(text, i)}
                        onKeyPress={(e) => handleOtpKeyPress(e, i)}
                        onFocus={() => setActiveOtpIndex(i)}
                        onBlur={() => setActiveOtpIndex(null)}
                        autoFocus={i === 0}
                    />
                ))}
            </View>
        );
    };

    useEffect(() => {
        if (visible && profile) {
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setPhoneNumber(profile.phoneNumber || '');
            setBio(profile.bio || '');
            setGender(profile.gender || '');
            setDateOfBirth(profile.dateOfBirth || '');
            setFavoriteDeity(profile.favoriteDeity || '');
            setEmail(profile.email || '');
        }
    }, [visible]);

    const handleSave = () => {
        const payload: any = {};
        if (firstName?.trim()) payload.firstName = firstName.trim();
        if (lastName !== undefined && lastName !== null) payload.lastName = lastName.trim();
        if (phoneNumber?.trim()) payload.phoneNumber = phoneNumber.trim();
        if (bio?.trim()) payload.bio = bio.trim();
        if (gender?.trim()) payload.gender = gender.trim();
        if (dateOfBirth?.trim()) payload.dateOfBirth = dateOfBirth.trim();
        if (favoriteDeity?.trim()) payload.favoriteDeity = favoriteDeity.trim();
        if (email?.trim()) payload.email = email.trim();

        updateProfile(payload, {
            onSuccess: () => {
                onClose();
            },
            onError: (error: any) => {
                const message = error?.message || "Could not update profile. Please try again.";
                setErrorMessage(message);
            }
        });
    };

    const handleSelectPhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setErrorMessage('Sorry, we need camera roll permissions to make this work!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setIsUploadingPhoto(true);
                const asset = result.assets[0];

                const formData = new FormData();
                const uriParts = asset.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];

                formData.append('file', {
                    uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                    name: `photo.${fileType}`,
                    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
                } as any);

                console.log('[EditProfileModal] Uploading file:', { fileType, size: asset.width });
                try {
                    const response = await authApi.uploadFile(formData);
                    console.log('[EditProfileModal] Upload response:', JSON.stringify(response));
                    
                    // The URL may be at response.url OR response.data.url depending on wrapper level
                    const uploadedUrl = response?.url || (response as any)?.data?.url;
                    if (uploadedUrl) {
                        console.log('[EditProfileModal] Upload successful, updating profile with avatar URL:', uploadedUrl);
                        updateProfile({ avatar: uploadedUrl }, {
                            onSuccess: () => {
                                console.log('[EditProfileModal] Profile updated successfully with new avatar');
                                setErrorMessage(null);
                            },
                            onError: (error) => {
                                console.error('[EditProfileModal] Profile update failed:', error);
                                setErrorMessage('Failed to update profile picture. Please try again.');
                            }
                        });
                    } else {
                        console.error('[EditProfileModal] Upload response missing URL:', response);
                        setErrorMessage('Upload failed - no URL returned. Please try again.');
                    }
                } catch (uploadError: any) {
                    console.error('[EditProfileModal] Error uploading photo:', uploadError);
                    
                    // Provide specific error messages based on error type
                    let errorMsg = 'Could not upload photo. Please try again.';
                    if (uploadError?.statusCode === 401) {
                        errorMsg = 'Your session expired. Please log in again.';
                    } else if (uploadError?.statusCode === 413) {
                        errorMsg = 'File is too large. Please choose a smaller image.';
                    } else if (uploadError?.statusCode === 400) {
                        errorMsg = 'Invalid file format. Please choose a JPEG, PNG, or WebP image.';
                    } else if (uploadError?.statusCode === 500) {
                        errorMsg = 'Server error. Please try again later.';
                    }
                    setErrorMessage(errorMsg);
                }
            }
        } catch (error) {
            console.error('[EditProfileModal] Error selecting photo:', error);
            setErrorMessage('Could not select photo. Please try again.');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const openEditDialog = (field: string, currentValue: string) => {
        if (field === 'email') {
            setEditingField(field);
            setEditValue(currentValue);
            setEmailStep('confirm');
            return;
        }

        setEditingField(field);
        setEditValue(currentValue);

        if (field === 'dateOfBirth') {
            if (currentValue && currentValue.includes('-')) {
                const datePart = currentValue.split('T')[0];
                const parts = datePart.split('-');
                if (parts.length >= 3) {
                    setDobYear(parts[0]);
                    setDobMonth(parts[1]);
                    setDobDay(parts[2]);
                } else {
                    setDobYear(''); setDobMonth(''); setDobDay('');
                }
            } else {
                setDobYear(''); setDobMonth(''); setDobDay('');
            }
        }
    };

    const saveFieldEdit = () => {
        if (editingField === 'email') {
            if (emailStep === 'confirm') {
                if (!profile.email || profile.email.trim() === '') {
                    setEmailStep('new-email');
                    setEmailOtp('');
                    setNewEmailEntry('');
                    return;
                }

                setEmailStep('current-otp');
                setEmailOtp('');
                setNewEmailEntry('');
                setResendCooldown(60); // Disable Resend immediately before API call
                sendEmailOtp.mutate(
                    { email: profile.email, purpose: 'login', language: i18n.language },
                    {
                        onError: (err: any) => {
                            setResendCooldown(0);
                            setErrorMessage(err.message || "Failed to send OTP");
                            setEditingField(null);
                        }
                    }
                );
            } else if (emailStep === 'current-otp') {
                if (emailOtp.replace(/\s/g, '').length !== 6) {
                    setOtpError('Please enter all 6 digits');
                    return;
                }
                verifyEmailOtpRaw.mutate(
                    { email: profile.email, otp: emailOtp },
                    {
                        onSuccess: () => {
                            setOtpError(null);
                            setEmailStep('new-email');
                            setEmailOtp('');
                        },
                        onError: (err: any) => {
                            // Clear boxes so user can retry without closing dialog
                            setEmailOtp('');
                            setOtpError(err.message || 'Incorrect OTP. Please try again.');
                            setTimeout(() => otpRefs.current[0]?.focus(), 50);
                        }
                    }
                );
            } else if (emailStep === 'new-email') {
                if (!newEmailEntry || !newEmailEntry.includes('@')) {
                    setErrorMessage('Please enter a valid email');
                    return;
                }
                if (newEmailEntry === profile.email) {
                    setErrorMessage('New email cannot be same as current');
                    return;
                }
                setResendCooldown(60); // Disable Resend immediately before API call
                sendEmailOtp.mutate(
                    { email: newEmailEntry, purpose: 'update-email' },
                    {
                        onSuccess: () => {
                            setEmailStep('new-otp');
                            setEmailOtp('');
                        },
                        onError: (err) => {
                            setResendCooldown(0);
                            setErrorMessage(err.message || 'Failed to send OTP to new email');
                        }
                    }
                );
            } else if (emailStep === 'new-otp') {
                if (emailOtp.replace(/\s/g, '').length !== 6) {
                    setOtpError('Please enter all 6 digits');
                    return;
                }
                updateEmailMutation.mutate(
                    { email: newEmailEntry, otp: emailOtp },
                    {
                        onSuccess: (data) => {
                            setOtpError(null);
                            setEmail(data.profile.email);
                            setEditingField(null);
                            setEmailStep('IDLE');
                            setEmailOtp('');
                            setNewEmailEntry('');
                        },
                        onError: (err: any) => {
                            // Clear boxes so user can retry without closing dialog
                            setEmailOtp('');
                            setOtpError(err.message || 'Incorrect OTP. Please try again.');
                            setTimeout(() => otpRefs.current[0]?.focus(), 50);
                        }
                    }
                );
            }
            return;
        }

        let savePayload: any = {};
        switch (editingField) {
            case 'firstName': setFirstName(editValue); savePayload.firstName = editValue; break;
            case 'lastName': setLastName(editValue); savePayload.lastName = editValue; break;
            case 'phoneNumber': setPhoneNumber(editValue); savePayload.phoneNumber = editValue; break;
            case 'gender': setGender(editValue); savePayload.gender = editValue; break;
            // case 'email': handled above
            case 'dateOfBirth':
                if (dobYear && dobMonth && dobDay) {
                    const dobStr = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
                    setDateOfBirth(dobStr);
                    savePayload.dateOfBirth = dobStr;
                } else {
                    setDateOfBirth('');
                }
                break;
            case 'favoriteDeity': setFavoriteDeity(editValue); savePayload.favoriteDeity = editValue; break;
            case 'bio': setBio(editValue); savePayload.bio = editValue; break;
        }
        setEditingField(null);
        // Immediately save to server
        if (Object.keys(savePayload).length > 0) {
            updateProfile(savePayload, {
                onError: (err) => setErrorMessage(err?.message || 'Failed to save changes')
            });
        }
    };

    const getFieldTitle = () => {
        if (editingField === 'email') {
            switch (emailStep) {
                case 'confirm': return t('editProfile.emailUpdate.changeEmail');
                case 'current-otp': return t('editProfile.emailUpdate.verifyCurrent');
                case 'new-email': return t('editProfile.emailUpdate.enterNew');
                case 'new-otp': return t('editProfile.emailUpdate.verifyNew');
                default: return t('editProfile.editEmail');
            }
        }
        switch (editingField) {
            case 'firstName': return t('editProfile.editFirstName');
            case 'lastName': return t('editProfile.editLastName');
            case 'gender': return t('editProfile.selectGender');
            case 'dateOfBirth': return t('editProfile.editDob');
            case 'favoriteDeity': return t('editProfile.editDeity');
            case 'bio': return t('editProfile.editBio');
            case 'phoneNumber': return t('editProfile.editPhone');
            case 'email': return t('editProfile.editEmail');
            default: return t('editProfile.defaultEdit');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                <LinearGradient
                    colors={['#E65100', '#FF9800', '#FFB74D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 5 }}
                    style={{ height: statusBarH, width: '100%', position: 'absolute', top: 0, zIndex: 100 }}
                />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                    >
                        <LinearGradient
                            colors={['#E65100', '#FF9800', '#FFB74D']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.headerGradient, { height: 140 + statusBarH }]}
                        >
                            <View style={[styles.headerRow, { paddingTop: statusBarH + 14 }]}>
                                <TouchableOpacity onPress={onClose} style={styles.headerButton} activeOpacity={0.7}>
                                    <Ionicons name="close" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                                <Typography variant="h2" style={styles.headerTitle}>{t('editProfile.title')}</Typography>
                                <TouchableOpacity onPress={handleSave} style={styles.headerButton} activeOpacity={0.7} disabled={isPending}>
                                    {isPending ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <View style={styles.avatarSection}>
                            <TouchableOpacity
                                style={styles.avatarWrapper}
                                onPress={handleSelectPhoto}
                                disabled={isUploadingPhoto}
                                activeOpacity={0.8}
                            >
                                {isUploadingPhoto ? (
                                    <View style={[styles.avatar, styles.placeholderAvatar]}>
                                        <ActivityIndicator size="large" color="#FF9800" />
                                    </View>
                                ) : profile.avatar ? (
                                    <Image
                                        source={{ uri: getFullImageUrl(profile.avatar) }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={styles.placeholderAvatar}>
                                        <Typography variant="h1" style={styles.placeholderText}>
                                            {(profile.firstName?.[0] || profile.username?.[0] || 'U').toUpperCase()}
                                        </Typography>
                                    </View>
                                )}
                                <View style={styles.cameraBadge}>
                                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                            <Typography variant="body2" style={styles.changePhotoText}>{t('editProfile.tapToChangePhoto')}</Typography>
                        </View>

                        <View style={styles.formBody}>
                            <Typography variant="h3" style={styles.sectionTitle}>{t('editProfile.personalDetails')}</Typography>

                            <View style={styles.card}>
                                <EditableRow icon="person-outline" label={t('editProfile.firstName')} value={firstName} onPress={() => openEditDialog('firstName', firstName)} placeholder={t('editProfile.firstNamePlaceholder')} />
                                <View style={styles.divider} />
                                <EditableRow icon="person-outline" label={t('editProfile.lastName')} value={lastName} onPress={() => openEditDialog('lastName', lastName)} placeholder={t('editProfile.lastNamePlaceholder')} />
                                <View style={styles.divider} />
                                <EditableRow icon={gender?.toLowerCase() === 'male' ? 'man' : gender?.toLowerCase() === 'female' ? 'woman' : 'male-female'} label={t('profileScreen.gender')} value={getGenderLabel(gender)} onPress={() => openEditDialog('gender', gender)} placeholder={t('editProfile.genderPlaceholder')} />
                                <View style={styles.divider} />
                                <EditableRow icon="mail-outline" label={t('editProfile.emailAddress')} value={email} onPress={() => openEditDialog('email', email)} placeholder={t('editProfile.emailPlaceholder')} />
                                <View style={styles.divider} />
                                <EditableRow icon="calendar-outline" label={t('profileScreen.dob')} value={dateOfBirth ? dateOfBirth.split('T')[0] : ''} onPress={() => openEditDialog('dateOfBirth', dateOfBirth)} placeholder={t('editProfile.dobPlaceholder')} />
                            </View>

                            <Typography variant="h3" style={styles.sectionTitle}>{t('editProfile.spiritualDetails')}</Typography>

                            <View style={styles.card}>
                                <EditableRow icon="rose-outline" imageUrl={getFavoriteDeityDetails.imageUrl} label={t('profileScreen.favoriteDeity')} value={favoriteDeityName} onPress={() => openEditDialog('favoriteDeity', favoriteDeity)} placeholder={t('editProfile.deityPlaceholder')} />
                                <View style={styles.divider} />
                                <EditableRow icon="document-text-outline" label={t('editProfile.bio')} value={bio} onPress={() => openEditDialog('bio', bio)} placeholder={t('editProfile.bioPlaceholder')} />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Field Edit Dialog */}
            <Modal
                visible={!!editingField}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditingField(null)}
            >
                <TouchableOpacity style={styles.dialogOverlay} activeOpacity={1} onPress={() => setEditingField(null)}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', alignItems: 'center' }}>
                        <TouchableOpacity activeOpacity={1} style={styles.dialogContainer}>
                            <Typography variant="h3" style={styles.dialogTitle}>{getFieldTitle()}</Typography>

                            {editingField === 'gender' ? (
                                <View style={styles.genderDialogContainer}>
                                    {genderOptions.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[
                                                styles.genderDialogCard,
                                                gender === opt.value && styles.genderDialogCardSelected
                                            ]}
                                            onPress={() => {
                                                setEditValue(opt.value);
                                                setGender(opt.value);
                                                setEditingField(null);
                                                updateProfile({ gender: opt.value }, {
                                                    onError: (err) => setErrorMessage(err?.message || "Failed to save gender")
                                                });
                                            }}
                                        >
                                            <View style={[
                                                styles.genderDialogIconContainer,
                                                gender === opt.value && styles.genderDialogIconContainerSelected
                                            ]}>
                                                <Ionicons
                                                    name={opt.icon as any}
                                                    size={36}
                                                    color={gender === opt.value ? '#FF9800' : '#9E9E9E'}
                                                />
                                            </View>
                                            <Typography
                                                variant="body1"
                                                style={[
                                                    styles.genderDialogLabel,
                                                    gender === opt.value && styles.genderDialogLabelSelected
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {opt.label}
                                            </Typography>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : editingField === 'favoriteDeity' ? (
                                <View style={styles.optionsContainer}>
                                    {isDeitiesLoading ? (
                                        <ActivityIndicator size="small" color="#FF9800" style={{ padding: 20 }} />
                                    ) : (deities || []).map(option => {
                                        const displayName = option.name[i18n.language as keyof typeof option.name] || option.name.en;
                                        return (
                                        <TouchableOpacity
                                            key={option._id}
                                            style={[styles.selectionOption, (editValue === option._id || editValue === option.name?.en) && styles.selectionOptionSelected, { paddingVertical: 10 }]}
                                            onPress={() => setEditValue(option._id)}
                                        >
                                            {option.imageUrl ? (
                                                <Image 
                                                    source={{ uri: getFullImageUrl(option.imageUrl) }}
                                                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                                                />
                                            ) : (
                                                <View style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Ionicons name="rose-outline" size={20} color="#FF9800" />
                                                </View>
                                            )}
                                            <Typography variant="body1" style={[styles.selectionOptionText, { flex: 1 }, (editValue === option._id || editValue === option.name?.en) && { color: '#FF9800', fontFamily: 'Poppins_600SemiBold' }]}>
                                                {displayName}
                                            </Typography>
                                            {(editValue === option._id || editValue === option.name?.en) && (
                                                <Ionicons name="checkmark-circle" size={24} color="#FF9800" />
                                            )}
                                        </TouchableOpacity>
                                    )})}
                                </View>
                            ) : editingField === 'dateOfBirth' ? (
                                <View style={styles.dobContainer}>
                                    <View>
                                        <Typography variant="caption" style={styles.dobLabel}>DD</Typography>
                                        <GradientInputBorder filled={dobDay.length === 2} borderRadius={10} borderWidth={2}>
                                            <RNTextInput
                                                style={[styles.dobInput as any, styles.dobInputDayMonth]}
                                                value={dobDay}
                                                onChangeText={(text) => setDobDay(text.replace(/[^0-9]/g, ''))}
                                                placeholder="DD"
                                                keyboardType="numeric"
                                                maxLength={2}
                                                placeholderTextColor="#BDBDBD"
                                                textAlign="center"
                                            />
                                        </GradientInputBorder>
                                    </View>
                                    <View>
                                        <Typography variant="caption" style={styles.dobLabel}>MM</Typography>
                                        <GradientInputBorder filled={dobMonth.length === 2} borderRadius={10} borderWidth={2}>
                                            <RNTextInput
                                                style={[styles.dobInput as any, styles.dobInputDayMonth]}
                                                value={dobMonth}
                                                onChangeText={(text) => setDobMonth(text.replace(/[^0-9]/g, ''))}
                                                placeholder="MM"
                                                keyboardType="numeric"
                                                maxLength={2}
                                                placeholderTextColor="#BDBDBD"
                                                textAlign="center"
                                            />
                                        </GradientInputBorder>
                                    </View>
                                    <View>
                                        <Typography variant="caption" style={styles.dobLabel}>YYYY</Typography>
                                        <GradientInputBorder filled={dobYear.length === 4} borderRadius={10} borderWidth={2}>
                                            <RNTextInput
                                                style={[styles.dobInput as any, styles.dobInputYear]}
                                                value={dobYear}
                                                onChangeText={(text) => setDobYear(text.replace(/[^0-9]/g, ''))}
                                                placeholder="YYYY"
                                                keyboardType="numeric"
                                                maxLength={4}
                                                placeholderTextColor="#BDBDBD"
                                                textAlign="center"
                                            />
                                        </GradientInputBorder>
                                    </View>
                                </View>
                            ) : editingField === 'email' ? (
                                <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: 10 }}>
                                    {emailStep === 'confirm' && (
                                        <Typography variant="body2" style={{ textAlign: 'center', marginBottom: 24, color: '#444', width: '100%' }}>
                                            {t('editProfile.emailUpdate.confirmMessage', { email: profile.email ? t('editProfile.emailUpdate.verifyCurrent') : t('editProfile.emailUpdate.enterNew') })}
                                        </Typography>
                                    )}
                                    {emailStep === 'current-otp' && (
                                        <>
                                            <Typography variant="body2" style={{ textAlign: 'center', marginBottom: 20, color: '#666', width: '100%' }}>
                                                {t('editProfile.emailUpdate.otpSentCurrent', { email: profile.email })}
                                            </Typography>
                                            {renderOtpInput()}
                                            {otpError ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 8 }}>
                                                    <Ionicons name="alert-circle" size={14} color="#F44336" style={{ marginRight: 4 }} />
                                                    <Typography variant="caption" style={{ color: '#F44336', fontSize: 12 }}>{otpError}</Typography>
                                                </View>
                                            ) : null}
                                        </>
                                    )}
                                    {emailStep === 'new-email' && (
                                        <>
                                            <Typography variant="body2" style={{ textAlign: 'center', marginBottom: 20, color: '#666', width: '100%' }}>
                                                {t('editProfile.emailUpdate.enterNewEmail')}
                                            </Typography>
                                            <GradientInputBorder filled={newEmailEntry.length > 5} borderRadius={12} borderWidth={1.5} style={{ width: '100%', marginBottom: 24 }}>
                                                <RNTextInput
                                                    style={{ height: 50, fontSize: 16, paddingHorizontal: 16, color: '#333', textAlign: 'center' }}
                                                    value={newEmailEntry}
                                                    onChangeText={setNewEmailEntry}
                                                    placeholder="new@example.com"
                                                    placeholderTextColor="#999"
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    autoFocus
                                                />
                                            </GradientInputBorder>
                                        </>
                                    )}
                                    {emailStep === 'new-otp' && (
                                        <>
                                            <Typography variant="body2" style={{ textAlign: 'center', marginBottom: 20, color: '#666', width: '100%' }}>
                                                {t('editProfile.emailUpdate.otpSentNew', { email: newEmailEntry })}
                                            </Typography>
                                            {renderOtpInput()}
                                            {otpError ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 8 }}>
                                                    <Ionicons name="alert-circle" size={14} color="#F44336" style={{ marginRight: 4 }} />
                                                    <Typography variant="caption" style={{ color: '#F44336', fontSize: 12 }}>{otpError}</Typography>
                                                </View>
                                            ) : null}
                                        </>
                                    )}
                                </View>
                            ) : (
                                <RNTextInput
                                    style={[styles.dialogTextInput, editingField === 'bio' && { height: 100, textAlignVertical: 'top' }]}
                                    value={editValue}
                                    onChangeText={setEditValue}
                                    multiline={editingField === 'bio'}
                                    autoFocus
                                    placeholder={
                                        editingField === 'firstName' ? t('editProfile.firstNamePlaceholder') :
                                        editingField === 'lastName' ? t('editProfile.lastNamePlaceholder') :
                                        editingField === 'bio' ? t('editProfile.bioPlaceholder') :
                                        editingField === 'phoneNumber' ? t('editProfile.phonePlaceholder') :
                                        t('editProfile.defaultEdit')
                                    }
                                    placeholderTextColor="#BDBDBD"
                                />
                            )}

                            <View style={[
                                styles.dialogButtons,
                                (editingField === 'email' && (emailStep === 'current-otp' || emailStep === 'new-otp'))
                                    ? { justifyContent: 'space-between' }
                                    : {}
                            ]}>
                                <TouchableOpacity style={styles.dialogButton} onPress={() => { setOtpError(null); setEditingField(null); }}>
                                    <Typography variant="body2" style={styles.dialogButtonText}>{t('editProfile.cancel')}</Typography>
                                </TouchableOpacity>

                                {/* Resend OTP button — shown only during OTP entry steps */}
                                {editingField === 'email' && (emailStep === 'current-otp' || emailStep === 'new-otp') && (
                                    <TouchableOpacity
                                        style={[
                                            styles.dialogButton,
                                            styles.dialogButtonResend,
                                            resendCooldown > 0 && styles.dialogButtonResendDisabled
                                        ]}
                                        onPress={handleResendOtp}
                                        disabled={isResendingOtp || resendCooldown > 0}
                                    >
                                        {isResendingOtp ? (
                                            <ActivityIndicator size="small" color="#FF9800" />
                                        ) : resendCooldown > 0 ? (
                                            <Typography variant="body2" style={[styles.dialogButtonResendText, { color: '#BDBDBD' }]}>
                                                {t('editProfile.emailUpdate.resendOtp', 'Resend')} ({resendCooldown}s)
                                            </Typography>
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Ionicons name="refresh" size={14} color="#FF9800" />
                                                <Typography variant="body2" style={styles.dialogButtonResendText}>{t('editProfile.emailUpdate.resendOtp', 'Resend')}</Typography>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.dialogButton, styles.dialogButtonPrimary]}
                                    onPress={saveFieldEdit}
                                    disabled={verifyEmailOtpRaw.isPending || updateEmailMutation.isPending || sendEmailOtp.isPending}
                                >
                                    {(verifyEmailOtpRaw.isPending || updateEmailMutation.isPending || sendEmailOtp.isPending) && editingField === 'email' ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Typography variant="body2" style={styles.dialogButtonTextLight}>
                                            {editingField === 'email' 
                                                ? (emailStep === 'confirm' ? t('editProfile.emailUpdate.proceed')
                                                    : emailStep === 'current-otp' ? t('editProfile.emailUpdate.verify') 
                                                    : emailStep === 'new-email' ? t('editProfile.emailUpdate.sendOtp') 
                                                    : emailStep === 'new-otp' ? t('editProfile.emailUpdate.update') 
                                                    : t('editProfile.emailUpdate.next'))
                                                : t('editProfile.save')}
                                        </Typography>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>
            
            <ErrorDialog
                visible={!!errorMessage}
                message={errorMessage || ''}
                onClose={() => setErrorMessage(null)}
            />
        </Modal>
    );
};

// ─── Custom Editable Row ──────────────────────────────────────────────

const EditableRow = ({ icon, imageUrl, label, value, onPress, placeholder }: any) => (
    <TouchableOpacity style={styles.inputContainer} onPress={onPress} activeOpacity={0.7}>
        {imageUrl ? (
            <Image 
                source={{ uri: getFullImageUrl(imageUrl) }} 
                style={[styles.iconBox, { padding: 0, backgroundColor: 'transparent' }]} 
            />
        ) : (
            <View style={styles.iconBox}>
                <Ionicons name={icon} size={20} color="#FF9800" />
            </View>
        )}
        <View style={styles.inputWrapper}>
            <Typography variant="caption" style={styles.inputLabel}>{label}</Typography>
            <Typography variant="body1" style={[styles.textValue, !value && { color: '#9E9E9E' }]} numberOfLines={1}>
                {value || placeholder}
            </Typography>
        </View>
        <Ionicons name="pencil" size={16} color="#E0E0E0" />
    </TouchableOpacity>
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
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 0.5,
    },
    avatarSection: {
        alignItems: 'center',
        marginTop: -52,
        marginBottom: 24,
    },
    avatarWrapper: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: 58,
        padding: 4,
        ...shadows.lg,
        shadowColor: '#FF9800',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
    cameraBadge: {
        position: 'absolute',
        bottom: 2,
        right: -2,
        backgroundColor: '#FF9800',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    changePhotoText: {
        marginTop: 10,
        color: '#757575',
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
    },
    formBody: {
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
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 28,
        ...shadows.sm,
        shadowColor: '#000',
        shadowOpacity: 0.05,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    inputWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    inputLabel: {
        color: '#9E9E9E',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    textValue: {
        color: '#212121',
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
    },
    divider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginLeft: 56,
    },
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dialogContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 0,
        ...shadows.lg,
    },
    dialogTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: '#212121',
        marginBottom: 20,
    },
    dialogTextInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
        color: '#212121',
        marginBottom: 24,
        minHeight: 50,
    },
    optionsContainer: {
        marginBottom: 24,
    },
    selectionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    selectionOptionSelected: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FFE0B2',
    },
    selectionOptionText: {
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        color: '#424242',
    },
    dobContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        marginTop: 18,
        gap: 12,
    },
    dobLabel: {
        position: 'absolute',
        top: -24,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#9E9E9E',
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
    },
    dobInput: {
        backgroundColor: '#FFFFFF',
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: '#212121',
        paddingVertical: 12,
    },
    dobInputDayMonth: {
        width: 70,
        height: 50,
    },
    dobInputYear: {
        width: 100,
        height: 50,
    },
    dialogButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
        alignItems: 'center',
        marginTop: 20,
        marginHorizontal: -24,
        marginBottom: -0,
        paddingHorizontal: 24,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    dialogButtonResend: {
        borderWidth: 1.5,
        borderColor: '#FFB74D',
        backgroundColor: '#FFF8F0',
        flex: 1,
    },
    dialogButtonResendText: {
        color: '#FF9800',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 11,
        letterSpacing: 0.2,
    },
    dialogButtonResendDisabled: {
        borderColor: '#E0E0E0',
        backgroundColor: '#F5F5F5',
        opacity: 0.6,
    },
    dialogButton: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 40,
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
    },
    dialogButtonPrimary: {
        backgroundColor: '#FF9800',
        borderWidth: 0,
    },
    dialogButtonText: {
        color: '#757575',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 11,
        letterSpacing: 0.3,
    },
    dialogButtonTextLight: {
        color: '#FFFFFF',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 11,
        letterSpacing: 0.3,
    },
    genderDialogContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginTop: 18,
        gap: 12,
    },
    genderDialogCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAFAFA',
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 12,
    },
    genderDialogCardSelected: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FFE0B2',
    },
    genderDialogIconContainer: {
        marginBottom: 12,
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderDialogIconContainerSelected: {
        backgroundColor: '#FFEBEE',
    },
    genderDialogLabel: {
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
        color: '#9E9E9E',
        textAlign: 'center',
    },
    genderDialogLabelSelected: {
        color: '#FF9800',
        fontFamily: 'Poppins_600SemiBold',
    },
});
