import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';

const { width } = Dimensions.get('window');

// Responsive OTP box size — prevents boxes touching on narrow devices (iPhone SE, etc.)
const otpBoxWidth = width < 360 ? 37 : width < 390 ? 41 : 45;
const otpBoxHeight = width < 360 ? 42 : width < 390 ? 46 : 50;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral[0],
        padding: spacing.lg,
        paddingTop: spacing.xxl, // Status bar padding
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    backButton: {
        marginRight: spacing.md,
        padding: spacing.xs,
    },
    headerLogoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 24,
        height: 24,
        marginRight: spacing.sm,
    },
    headerText: {
        fontSize: typography.fontSizes.lg,
        fontWeight: typography.fontWeights.bold as any,
        color: '#0F1E3D',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
    },
    // Illustration Styles (Matching RegisterScreen)
    illustrationArea: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        marginTop: -spacing.sm,
        paddingRight: 0,
    },
    image: {
        marginRight: spacing.xs,
        marginLeft: -spacing.md, // shift image left
    },
    bubbleContainer: {
        flex: 1,
        marginLeft: spacing.sm,
        marginRight: 0,
    },

    bubbleTitle: {
        fontSize: typography.fontSizes.lg, // Increased to lg (16)
        fontWeight: typography.fontWeights.semibold as any,
        color: '#424242',
        marginBottom: 2,
    },
    bubbleSubtitle: {
        fontSize: typography.fontSizes.md, // Increased to md (14)
        color: '#616161',
    },

    // Form Styles
    formContainer: {
        marginTop: spacing.sm,
    },
    label: {
        fontSize: typography.fontSizes.md,
        color: '#757575',
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral[50],
        borderWidth: 1,
        borderColor: colors.neutral[200],
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    countryCode: {
        fontSize: typography.fontSizes.md,
        color: '#424242',
        marginRight: spacing.sm,
        fontWeight: typography.fontWeights.medium as any,
    },
    phoneInput: { // Renamed from input to match RegisterScreen usage
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: typography.fontSizes.md,
        color: '#424242',
    },
    // OTP Styles
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    otpInputBox: {
        width: otpBoxWidth,
        height: otpBoxHeight,
        borderWidth: 1,
        borderColor: colors.neutral[200],
        borderRadius: borderRadius.lg,
        backgroundColor: colors.neutral[50],
        textAlign: 'center',
        fontSize: typography.fontSizes.xl,
        fontWeight: typography.fontWeights.bold as any,
        color: '#424242',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -spacing.sm,
        marginBottom: spacing.xl,
    },
    resendText: {
        fontSize: typography.fontSizes.sm,
        color: '#757575',
    },
    timerText: {
        fontSize: typography.fontSizes.sm,
        color: '#757575',
    },

    // Buttons
    submitButton: {
        backgroundColor: colors.secondary[400],
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: colors.neutral[300],
        borderBottomColor: colors.neutral[400],
        opacity: 0.7,
    },
    buttonText: {
        color: colors.neutral[0],
        fontSize: typography.fontSizes.md,
        fontWeight: typography.fontWeights.bold as any,
        textTransform: 'uppercase',
    },
    // Pinned footer — equal top/bottom feel, never moves with keyboard
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: colors.neutral[0],
    },
});

