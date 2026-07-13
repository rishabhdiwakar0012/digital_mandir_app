import React, { useState, useEffect, useRef, useMemo } from 'react';

import { View, Text, TextInput, TouchableOpacity, Image, Platform, ScrollView, Keyboard, Dimensions, KeyboardAvoidingView, useWindowDimensions, Alert, ActivityIndicator, StyleSheet, StatusBar, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { styles } from './styles';
import { REGISTER_CONFIG } from './constants';
import { Assets } from '../../../../theme';
import { GoogleLogo } from '../../../atoms/GoogleLogo';
import { TypewriterText } from '../../../atoms/TypewriterText';
import { ChatBubble } from '../../../atoms/ChatBubble';
import { Button } from '../../../atoms/Button/Button';
import { HeaderLogo } from '../../../molecules';
import { GradientInputBorder } from '../../../atoms/GradientInputBorder';
import { useSendEmailOtp, useVerifyEmailOtpRaw, useGoogleAuthRaw, useUpdateProfile } from '../../../../api/hooks/useAuth';
import { useAuthStore } from '../../../../store/authStore';
import { secureStorage } from '../../../../utils/storage';
import { config } from '../../../../config';
import { useGoogleSignIn } from '../../../../hooks/useGoogleSignIn';

interface RegisterScreenProps {
    onBack: () => void;
    onRegisterSuccess: () => void;
    /** Pre-authenticated data from login flow when user is new */
    pendingAuth?: { user: any; tokens: any } | null;
}

const maskEmail = (value: string): string => {
    const emailValue = value?.trim().toLowerCase();
    if (!emailValue || !emailValue.includes('@')) return 'invalid-email';
    const [name, domain] = emailValue.split('@');
    if (!name || !domain) return 'invalid-email';
    if (name.length <= 2) return `${name[0] || '*'}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
};

type RegisterStep = 'EMAIL' | 'OTP' | 'NAME' | 'GENDER' | 'DOB' | 'DONE';

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
    onBack,
    onRegisterSuccess,
    pendingAuth,
}) => {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    // If we already have auth data from login flow, skip straight to NAME
    const [step, setStep] = useState<RegisterStep>(pendingAuth ? 'NAME' : 'EMAIL');

    // Add UI states for validation
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [isOtpSuccess, setIsOtpSuccess] = useState(false);

    // Step-specific bubble messages
    const getBubbleMessages = () => {
        switch (step) {
            case 'EMAIL': return { title: t('registerScreen.emailBubbleTitle'), subtitle: t('registerScreen.emailBubbleSubtitle') };
            case 'OTP': return { title: t('registerScreen.otpBubbleTitle'), subtitle: t('registerScreen.otpBubbleSubtitle') };
            case 'NAME': return { title: t('registerScreen.nameBubbleTitle'), subtitle: t('registerScreen.nameBubbleSubtitle') };
            case 'GENDER': return { title: t('registerScreen.genderBubbleTitle'), subtitle: t('registerScreen.genderBubbleSubtitle') };
            case 'DOB': return { title: t('registerScreen.dobBubbleTitle'), subtitle: t('registerScreen.dobBubbleSubtitle') };
            case 'DONE': return { title: t('registerScreen.doneBubbleTitle'), subtitle: t('registerScreen.doneBubbleSubtitle') };
        }
    };
    const bubbleMessages = getBubbleMessages();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        dob: '',
        age: '',
        email: ''
    });

    // Compact Age Input State
    const [dobDay, setDobDay] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobYear, setDobYear] = useState('');

    const dobDayRef = useRef<TextInput>(null);
    const dobMonthRef = useRef<TextInput>(null);
    const dobYearRef = useRef<TextInput>(null);

    const [otp, setOtp] = useState('');
    const [activeOtpIndex, setActiveOtpIndex] = useState<number | null>(null);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [timer, setTimer] = useState(REGISTER_CONFIG.resendTimer);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const { width } = Dimensions.get('window');

    // API hooks
    const sendEmailOtpMutation = useSendEmailOtp();
    const verifyEmailOtpMutation = useVerifyEmailOtpRaw();
    const googleAuthMutation = useGoogleAuthRaw();
    const updateProfileMutation = useUpdateProfile();

    // Google Sign-In hook (native)
    const { signIn: googleNativeSignIn, isLoading: isGoogleLoading, isExpoGo } = useGoogleSignIn();

    // Store auth data temporarily until registration is fully complete
    const pendingAuthRef = useRef<{ user: any; tokens: any } | null>(pendingAuth || null);

    const isLoading = sendEmailOtpMutation.isPending || verifyEmailOtpMutation.isPending || googleAuthMutation.isPending || updateProfileMutation.isPending || isGoogleLoading;

    // Keyboard listener
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerActive && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timer]);

    // Auto-focus OTP input when step changes to OTP
    useEffect(() => {
        if (step !== 'OTP') return;

        let fallbackTimer: ReturnType<typeof setTimeout>;

        // Wait for all screen transitions/animations to finish.
        // On Android, focus() calls are silently dropped while a keyboard
        // animation is in progress, so we MUST wait for interactions to end.
        const task = InteractionManager.runAfterInteractions(() => {
            otpRefs.current[0]?.focus();
            // Fallback for slow devices where the keyboard still hasn't settled
            fallbackTimer = setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 350);
        });

        return () => {
            task.cancel();
            clearTimeout(fallbackTimer);
        };
    }, [step]);

    const handleSendEmailOtp = () => {
        setEmailError(null);
        // Simple regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setEmailError(t('validation.emailInvalid'));
            return;
        }

        if (formData.email.trim().length > 0) {
            console.log('[RegisterScreen] sendEmailOtp:start', {
                email: maskEmail(formData.email),
            });
            sendEmailOtpMutation.mutate(
                { email: formData.email.trim(), purpose: 'register', language: i18n.language },
                {
                    onSuccess: () => {
                        console.log('[RegisterScreen] sendEmailOtp:success', {
                            email: maskEmail(formData.email),
                        });
                        setTimer(30);
                        setIsTimerActive(true);
                        if (step === 'OTP') {
                            setOtp('');
                            setOtpError(null);
                        } else {
                            // Explicitly dismiss the email keyboard first so Android
                            // doesn't drop our OTP focus call during its hide animation
                            Keyboard.dismiss();
                            setStep('OTP');
                        }
                    },
                    onError: (error: any) => {
                        console.error('[RegisterScreen] sendEmailOtp:error', {
                            email: maskEmail(formData.email),
                            message: error?.message,
                        });
                        setEmailError(error?.message || t('registerScreen.failedToSendOtp'));
                    },
                }
            );
        }
    };

    const handleVerifyEmailOtp = () => {
        setOtpError(null);
        if (otp.length === 6) {
            console.log('[RegisterScreen] verifyEmailOtp:start', {
                email: maskEmail(formData.email),
                otpLength: otp.length,
            });
            verifyEmailOtpMutation.mutate(
                { email: formData.email.trim(), otp },
                {
                    onSuccess: async (response: any) => {
                        setIsOtpSuccess(true);
                        const { user, accessToken, refreshToken, expiresIn, tokenType } = response;

                        console.log('[RegisterScreen] verifyEmailOtp:success', {
                            email: maskEmail(formData.email),
                            hasUser: !!user,
                        });

                        // Store tokens in secure storage but do NOT set auth state yet
                        await secureStorage.setObject(config.storage.tokenKey, {
                            accessToken,
                            refreshToken,
                            expiresIn,
                            tokenType,
                        });
                        await secureStorage.setObject(config.storage.userKey, user);

                        // Save for later when registration is complete
                        pendingAuthRef.current = {
                            user,
                            tokens: { accessToken, refreshToken, expiresIn, tokenType },
                        };

                        // Always proceed to profile setup (this is the register flow)
                        setStep('NAME');
                    },
                    onError: (error: any) => {
                        console.error('[RegisterScreen] verifyEmailOtp:error', {
                            email: maskEmail(formData.email),
                            message: error?.message,
                        });
                        setOtpError(error?.message || t('emailLoginScreen.incorrectOtp'));
                    },
                }
            );
        }
    };

    const handleGoogleSignup = async () => {
        try {
            const idToken = await googleNativeSignIn();
            if (!idToken) return; // cancelled

            console.log('[RegisterScreen] Google idToken received, calling backend...');
            googleAuthMutation.mutate(
                { idToken },
                {
                    onSuccess: async (response: any) => {
                        const { user, accessToken, refreshToken, expiresIn, tokenType, isNewUser } = response;
                        console.log('[RegisterScreen] googleAuth:success', { isNewUser });

                        await secureStorage.setObject(config.storage.tokenKey, {
                            accessToken, refreshToken, expiresIn, tokenType,
                        });
                        await secureStorage.setObject(config.storage.userKey, user);

                        if (isNewUser) {
                            // New user — proceed to profile setup
                            pendingAuthRef.current = {
                                user,
                                tokens: { accessToken, refreshToken, expiresIn, tokenType },
                            };
                            // Pre-fill name if Google provided it
                            if (user.firstName) {
                                setFormData(prev => ({ ...prev, firstName: user.firstName, lastName: user.lastName || '' }));
                            }
                            setStep('NAME');
                        } else {
                            // Existing user — go straight to main app
                            const { setAuth } = useAuthStore.getState();
                            setAuth(user, { accessToken, refreshToken, expiresIn, tokenType });
                            onRegisterSuccess();
                        }
                    },
                    onError: (error: any) => {
                        console.error('[RegisterScreen] googleAuth:error', error?.message);
                        Alert.alert('Google Sign-In Failed', error?.message || 'Something went wrong. Please try again.');
                    },
                }
            );
        } catch (error: any) {
            console.error('[RegisterScreen] Google Sign-In error:', error?.message);
            Alert.alert('Google Sign-In', error?.message || 'Failed to open Google Sign-In. Please try again.');
        }
    };

    const handleNameSubmit = () => {
        if (formData.firstName.trim().length > 0) {
            setStep('GENDER');
        }
    };

    const handleGenderSubmit = () => {
        if (formData.gender) {
            setStep('DOB');
        }
    };

    const handleDobSubmit = () => {
        if (formData.dob) {
            setStep('DONE');
        }
    };

    const handleDoneSubmit = () => {
        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            gender: formData.gender,
            dateOfBirth: formData.dob,
        };

        updateProfileMutation.mutate(payload, {
            onSuccess: (response: any) => {
                const updatedUser = response?.profile || response;
                // Profile collection complete — now set auth state so the app navigates to main
                if (pendingAuthRef.current) {
                    const { user, tokens } = pendingAuthRef.current;
                    const { setAuth } = useAuthStore.getState();
                    // Use updatedUser to ensure Redux/Zustand has the latest info immediately
                    setAuth(updatedUser || user, tokens);
                }
                onRegisterSuccess();
            },
            onError: (error: any) => {
                Alert.alert(
                    'Error',
                    error?.message || 'Failed to save profile details. Please try again.'
                );
            }
        });
    };

    const updateField = (field: keyof typeof formData, value: string) => {
        if (field === 'email' && emailError) {
             setEmailError(null);
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleBack = () => {
        switch (step) {
            case 'EMAIL':
                onBack();
                break;
            case 'OTP':
                setStep('EMAIL');
                setOtp('');
                setOtpError(null);
                setIsOtpSuccess(false);
                break;
            case 'NAME':
                // If we came from login (pendingAuth), go back to login screen
                if (pendingAuth) {
                    onBack();
                } else {
                    setStep('OTP');
                }
                break;
            case 'GENDER':
                setStep('NAME');
                break;
            case 'DOB':
                setStep('GENDER');
                break;
            case 'DONE':
                setStep('DOB');
                break;
        }
    };

    const getButtonConfig = () => {
        switch (step) {
            case 'EMAIL':
                return {
                    text: t('registerScreen.continueWithEmail'),
                    onPress: handleSendEmailOtp,
                    disabled: formData.email.trim().length === 0 || isLoading
                };
            case 'OTP':
                return {
                    text: t('registerScreen.continue'),
                    onPress: handleVerifyEmailOtp,
                    disabled: otp.length < 6 || isLoading
                };
            case 'NAME':
                return {
                    text: t('registerScreen.next'),
                    onPress: handleNameSubmit,
                    disabled: formData.firstName.trim().length === 0
                };
            case 'GENDER':
                return {
                    text: t('registerScreen.next'),
                    onPress: handleGenderSubmit,
                    disabled: !formData.gender
                };
            case 'DOB':
                return {
                    text: t('registerScreen.next'),
                    onPress: handleDobSubmit,
                    disabled: !formData.dob
                };
            case 'DONE':
                return {
                    text: t('registerScreen.continue'),
                    onPress: handleDoneSubmit,
                    disabled: false
                };
        }
    };

    const buttonConfig = getButtonConfig();

    const otpRefs = useRef<Array<TextInput | null>>([]);

    const handleOtpChange = (text: string, index: number) => {
        if (otpError) setOtpError(null);

        // Handle paste or multi-character input
        if (text.length > 1) {
            const pastedData = text.trim().slice(0, 6 - index).split('');
            const currentOtp = otp.split('');
            // Ensure we have a base to work with
            while (currentOtp.length < 6) currentOtp.push('');

            for (let i = 0; i < pastedData.length; i++) {
                if (index + i < 6) {
                    currentOtp[index + i] = pastedData[i];
                }
            }
            
            const finalOtp = currentOtp.join('').slice(0, 6);
            setOtp(finalOtp);
            
            // Focus the last filled box or the one after
            const nextIndex = Math.min(index + pastedData.length, 5);
            otpRefs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = otp.split('');
        if (text.length > 0) {
            newOtp[index] = text;
            setOtp(newOtp.join(''));
            if (index < 5) {
                otpRefs.current[index + 1]?.focus();
            }
        } else {
            newOtp[index] = '';
            setOtp(newOtp.join(''));
        }
    };

    const handleOtpKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (otp[index] === '' || otp[index] === undefined) {
                if (index > 0) {
                    otpRefs.current[index - 1]?.focus();
                    const newOtp = otp.split('');
                    newOtp[index - 1] = '';
                    setOtp(newOtp.join(''));
                }
            } else {
                const newOtp = otp.split('');
                newOtp[index] = '';
                setOtp(newOtp.join(''));
            }
        }
    };

    // Compact DOB Input Logic
    const handleDayChange = (text: string) => {
        // Only allow numbers
        if (/^\d*$/.test(text)) {
            setDobDay(text);
            if (text.length === 2) {
                dobMonthRef.current?.focus();
            }
        }
    };

    const handleMonthChange = (text: string) => {
        if (/^\d*$/.test(text)) {
            setDobMonth(text);
            if (text.length === 2) {
                dobYearRef.current?.focus();
            }
        }
    };

    const handleYearChange = (text: string) => {
        if (/^\d*$/.test(text)) {
            setDobYear(text);
            // Wait for 4 digits to consider valid
        }
    };

    // Backspace logic to focus previous field
    const handleDobKeyPress = (e: any, field: 'day' | 'month' | 'year') => {
        if (e.nativeEvent.key === 'Backspace') {
            if (field === 'month' && dobMonth === '') {
                dobDayRef.current?.focus();
            } else if (field === 'year' && dobYear === '') {
                dobMonthRef.current?.focus();
            }
        }
    };

    // Update Form Data when inputs change
    useEffect(() => {
        const day = parseInt(dobDay);
        const month = parseInt(dobMonth); // 1-12
        const year = parseInt(dobYear);

        if (dobDay.length >= 1 && dobMonth.length >= 1 && dobYear.length === 4) {
            // Basic validation
            if (year < 1920 || year > new Date().getFullYear()) {
                setFormData(prev => ({ ...prev, dob: '', age: '' }));
                return;
            }
            if (month < 1 || month > 12) {
                setFormData(prev => ({ ...prev, dob: '', age: '' }));
                return;
            }
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
                setFormData(prev => ({ ...prev, dob: '', age: '' }));
                return;
            }

            const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const birthDate = new Date(dateString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age >= 0) {
                setFormData(prev => ({
                    ...prev,
                    dob: dateString,
                    age: age.toString()
                }));
            } else {
                setFormData(prev => ({ ...prev, dob: '', age: '' }));
            }
        } else {
            setFormData(prev => ({ ...prev, dob: '', age: '' }));
        }

    }, [dobDay, dobMonth, dobYear]);


    const genderOptions = [
        { label: t('registerScreen.female'), value: 'female', icon: 'woman' },
        { label: t('registerScreen.male'), value: 'male', icon: 'man' },
        { label: t('registerScreen.other'), value: 'other', icon: 'male-female' }
    ];

    // Screen Size Logic matching LanguageSelector
    const { height } = useWindowDimensions();
    const isSmallScreen = height < 700;
    const isExtraSmallScreen = height < 680;

    const illustrationWidth = isExtraSmallScreen ? 90 : isSmallScreen ? 100 : 120;
    const illustrationHeight = isExtraSmallScreen ? 120 : isSmallScreen ? 135 : 160;

    return (
        <View style={[styles.container, { paddingBottom: 0, paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
            {step === 'DONE' ? (
                <View style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 20) }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#757575" />
                        </TouchableOpacity>
                        <View style={styles.headerLogoContainer}>
                            <HeaderLogo />
                        </View>
                    </View>

                    {/* Centered Done Content */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                        <LottieView
                            source={require('../../../../../assets/Upload Complete.json')}
                            autoPlay
                            loop={true}
                            style={{ width: 280, height: 280, marginBottom: 8 }}
                        />
                        
                        <Text style={[styles.doneTitle, { fontSize: 28, marginBottom: 8, color: '#333' }]}>{t('registerScreen.doneTitle') || 'All Set!'}</Text>
                        <Text style={[styles.doneSubtitle, { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 }]}>
                            {t('registerScreen.doneSubtitle') || 'Your profile has been created successfully.'}
                        </Text>
                    </View>

                    {/* Full Width Footer Button */}
                    <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
                        <Button
                            title={buttonConfig.text}
                            variant="primary"
                            fullWidth
                            onPress={buttonConfig.onPress}
                            loading={updateProfileMutation.isPending}
                            disabled={updateProfileMutation.isPending}
                        />
                    </View>
                </View>
            ) : (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 20) }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View>
                        {/* Header - scrolls with content */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#757575" />
                            </TouchableOpacity>
                            <View style={styles.headerLogoContainer}>
                                <HeaderLogo />
                            </View>
                        </View>

                        {/* Illustration Area */}
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
                                <TypewriterText text={bubbleMessages.title} style={styles.bubbleTitle} speed={35} delay={400} />
                                <TypewriterText text={bubbleMessages.subtitle} style={styles.bubbleSubtitle} speed={30} delay={1200} />
                            </ChatBubble>
                        </View>

                        {/* Form Area */}
                        <View style={[styles.formContainer, { paddingBottom: 20 }]}>

                        {step === 'EMAIL' && (
                            <>
                                <View style={[
                                    registerLocalStyles.inputContainer,
                                    isEmailFocused && { borderColor: '#F89626', borderWidth: 1.5 },
                                    !!emailError && { borderColor: 'red', borderWidth: 1.5 }
                                    ]}>
                                    <Ionicons
                                        name="mail-outline"
                                        size={20}
                                        color={!!emailError ? "red" : "#757575"}
                                        style={registerLocalStyles.inputIcon}
                                    />
                                    <TextInput
                                        style={[registerLocalStyles.input, !!emailError && { color: 'red' }]}
                                        placeholder={t('registerScreen.emailPlaceholder')}
                                        placeholderTextColor="#9e9e9e"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={formData.email}
                                        onChangeText={(txt) => updateField('email', txt)}
                                        onFocus={() => setIsEmailFocused(true)}
                                        onBlur={() => setIsEmailFocused(false)}
                                        editable={!isLoading}
                                        autoFocus
                                    />
                                </View>
                                {!!emailError && (
                                    <Text style={{ color: 'red', fontSize: 12, marginTop: 2, marginLeft: 4, marginBottom: 8 }}>
                                        {emailError}
                                    </Text>
                                )}
                            </>
                        )}

                        {step === 'OTP' && (
                            <>
                                <View style={[styles.otpContainer, { marginTop: 20, marginBottom: 0 }]}>
                                    {[0, 1, 2, 3, 4, 5].map((i) => {
                                        const hasError = !!otpError;
                                        const isSuccess = isOtpSuccess;
                                        const isActive = activeOtpIndex === i;
                                        
                                        if (hasError || isSuccess) {
                                            return (
                                                <TextInput
                                                    key={i}
                                                    ref={(ref) => { otpRefs.current[i] = ref; }}
                                                    style={[
                                                        styles.otpInputBox, 
                                                        { 
                                                            borderWidth: 2, 
                                                            borderColor: hasError ? 'red' : 'green',
                                                            backgroundColor: '#FFFFFF',
                                                        }
                                                    ]}
                                                    keyboardType="number-pad"
                                                    maxLength={6}
                                                    value={otp[i] || ''}
                                                    onChangeText={(text) => handleOtpChange(text, i)}
                                                    onKeyPress={(e) => handleOtpKeyPress(e, i)}
                                                    onFocus={() => setActiveOtpIndex(i)}
                                                    onBlur={() => setActiveOtpIndex(null)}
                                                    editable={!isLoading && !isSuccess}
                                                />
                                            )
                                        }

                                        return (
                                            <TextInput
                                                key={i}
                                                ref={(ref) => { otpRefs.current[i] = ref; }}
                                                style={[
                                                    styles.otpInputBox,
                                                    isActive && { borderColor: '#F89626', borderWidth: 2 }
                                                ]}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                value={otp[i] || ''}
                                                onChangeText={(text) => handleOtpChange(text, i)}
                                                onKeyPress={(e) => handleOtpKeyPress(e, i)}
                                                onFocus={() => setActiveOtpIndex(i)}
                                                onBlur={() => setActiveOtpIndex(null)}
                                                editable={!isLoading}
                                            />
                                        )
                                    })}
                                </View>
                                {!!otpError && (
                                    <Text style={{ color: 'red', fontSize: 12, marginTop: 2, marginHorizontal: 12, marginBottom: 8, textAlign: 'center' }}>
                                        {otpError}
                                    </Text>
                                )}

                                {/* Resend OTP Section */}
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
                                    <Text style={{ fontSize: 14, color: '#666' }}>{t('registerScreen.didntReceiveCode')} </Text>
                                    {isTimerActive ? (
                                        <Text style={{ fontSize: 14, color: '#999', fontWeight: '600' }}>
                                            {t('registerScreen.resendIn')} {Math.floor(timer / 60)}:{timer % 60 < 10 ? '0' : ''}{timer % 60}
                                        </Text>
                                    ) : (
                                        <TouchableOpacity onPress={handleSendEmailOtp} disabled={isLoading}>
                                            <Text style={{ fontSize: 14, color: '#F89626', fontWeight: 'bold' }}>
                                                {t('registerScreen.resendOtp')}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}

                        {step === 'NAME' && (
                            <>
                                <Text style={styles.label}>{t('registerScreen.firstNameLabel')}</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        activeField === 'firstName' && { borderColor: '#F89626', borderWidth: 2 }
                                    ]}
                                    placeholder={t('registerScreen.firstNamePlaceholder')}
                                    placeholderTextColor="#9e9e9e"
                                    value={formData.firstName}
                                    onChangeText={(txt) => updateField('firstName', txt)}
                                    onFocus={() => setActiveField('firstName')}
                                    onBlur={() => setActiveField(null)}
                                    autoFocus
                                />

                                <Text style={styles.label}>{t('registerScreen.lastNameLabel')}</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        activeField === 'lastName' && { borderColor: '#F89626', borderWidth: 2 }
                                    ]}
                                    placeholder={t('registerScreen.lastNamePlaceholder')}
                                    placeholderTextColor="#9e9e9e"
                                    value={formData.lastName}
                                    onChangeText={(txt) => updateField('lastName', txt)}
                                    onFocus={() => setActiveField('lastName')}
                                    onBlur={() => setActiveField(null)}
                                />
                            </>
                        )}

                        {step === 'GENDER' && (
                            <>
                                <Text style={styles.label}>{t('registerScreen.genderLabel')}</Text>
                                <View style={styles.genderContainer}>
                                    {genderOptions.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[
                                                styles.genderCard,
                                                formData.gender === opt.value && styles.genderCardSelected
                                            ]}
                                            onPress={() => updateField('gender', opt.value)}
                                        >
                                            <View style={[
                                                styles.genderIconContainer,
                                                formData.gender === opt.value && styles.genderIconContainerSelected
                                            ]}>
                                                <Ionicons
                                                    name={opt.icon as any}
                                                    size={32}
                                                    color={formData.gender === opt.value ? styles.genderLabelSelected.color : styles.genderLabel.color}
                                                />
                                            </View>
                                            <Text style={[
                                                styles.genderLabel,
                                                formData.gender === opt.value && styles.genderLabelSelected
                                            ]}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {step === 'DOB' && (
                            <>
                                <View style={styles.dobStepHeader}>
                                    <View style={styles.dobStepIcon}>
                                        <Ionicons name="calendar" size={20} color={styles.submitButton.backgroundColor} />
                                    </View>
                                    <Text style={styles.dobSectionTitle}>{t('registerScreen.dobLabel')}</Text>
                                </View>

                                {/* Compact Age Selector */}
                                <View style={styles.compactInputContainer}>
                                    <View>
                                        <Text style={styles.compactInputLabel}>Day</Text>
                                        <TextInput
                                            ref={dobDayRef}
                                            style={[
                                                styles.compactInputBox, 
                                                styles.compactInputBoxDayMonth,
                                                activeField === 'day' && { borderColor: '#F89626', borderWidth: 2 }
                                            ]}
                                            placeholder="DD"
                                            placeholderTextColor="#BDBDBD"
                                            keyboardType="number-pad"
                                            maxLength={2}
                                            value={dobDay}
                                            onChangeText={handleDayChange}
                                            onKeyPress={(e) => handleDobKeyPress(e, 'day')}
                                            onFocus={() => setActiveField('day')}
                                            onBlur={() => setActiveField(null)}
                                            autoFocus
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.compactInputLabel}>Month</Text>
                                        <TextInput
                                            ref={dobMonthRef}
                                            style={[
                                                styles.compactInputBox, 
                                                styles.compactInputBoxDayMonth,
                                                activeField === 'month' && { borderColor: '#F89626', borderWidth: 2 }
                                            ]}
                                            placeholder="MM"
                                            placeholderTextColor="#BDBDBD"
                                            keyboardType="number-pad"
                                            maxLength={2}
                                            value={dobMonth}
                                            onChangeText={handleMonthChange}
                                            onKeyPress={(e) => handleDobKeyPress(e, 'month')}
                                            onFocus={() => setActiveField('month')}
                                            onBlur={() => setActiveField(null)}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.compactInputLabel}>Year</Text>
                                        <TextInput
                                            ref={dobYearRef}
                                            style={[
                                                styles.compactInputBox, 
                                                styles.compactInputBoxYear,
                                                activeField === 'year' && { borderColor: '#F89626', borderWidth: 2 }
                                            ]}
                                            placeholder="YYYY"
                                            placeholderTextColor="#BDBDBD"
                                            keyboardType="number-pad"
                                            maxLength={4}
                                            value={dobYear}
                                            onChangeText={handleYearChange}
                                            onKeyPress={(e) => handleDobKeyPress(e, 'year')}
                                            onFocus={() => setActiveField('year')}
                                            onBlur={() => setActiveField(null)}
                                        />
                                    </View>
                                </View>

                                {/* Age Display - New Age Card */}
                                {formData.age ? (
                                    <View style={styles.ageCard}>
                                        <View style={styles.ageCardContent}>
                                            <View style={styles.ageCardIconContainer}>
                                                <Ionicons name="person" size={24} color="#F57F17" />
                                            </View>
                                            <View style={styles.ageCardTextContainer}>
                                                <Text style={styles.ageCardLabel}>
                                                    {t('registerScreen.ageLabel') || 'AGE'}
                                                </Text>
                                                <View style={styles.ageCardValueRow}>
                                                    <Text style={styles.ageCardValue}>
                                                        {formData.age}
                                                    </Text>
                                                    <Text style={styles.ageCardUnit}>
                                                        {t('registerScreen.yearsOld') || 'Years Old'}
                                                    </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                    <Ionicons name="calendar-outline" size={14} color="#757575" />
                                                    <Text style={[styles.ageCardDobText, { marginLeft: 6, marginTop: 0 }]}>
                                                        {new Date(formData.dob).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                ) : null}
                            </>
                        )}
                    </View>
                    </View>

                    <View style={{ marginTop: 'auto', paddingTop: 16 }}>
                        <Button
                            title={buttonConfig.text}
                            variant="primary"
                            fullWidth
                            onPress={buttonConfig.onPress}
                            loading={sendEmailOtpMutation.isPending || verifyEmailOtpMutation.isPending || updateProfileMutation.isPending}
                            disabled={buttonConfig.disabled}
                        />

                        {/* Additional Options for Email Step only */}
                        {step === 'EMAIL' && !isExpoGo && (
                            <>
                                <View style={registerLocalStyles.separatorContainer}>
                                    <View style={registerLocalStyles.separatorLine} />
                                    <Text style={registerLocalStyles.separatorText}>OR</Text>
                                    <View style={registerLocalStyles.separatorLine} />
                                </View>

                                <Button
                                    title={t('registerScreen.continueWithGoogle')}
                                    variant="outline"
                                    fullWidth
                                    onPress={handleGoogleSignup}
                                    loading={isLoading}
                                    leftIcon={<GoogleLogo width={20} height={20} />}
                                />
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            )}
        </View>
    );
};

const registerLocalStyles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1.0,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333333',
        padding: 0,
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    separatorText: {
        marginHorizontal: 12,
        color: '#9e9e9e',
        fontSize: 14,
        fontWeight: '500',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.0,
    },
    googleButtonText: {
        color: '#757575',
        fontSize: 16,
        fontWeight: 'bold',
    },
    primaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F89626',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
