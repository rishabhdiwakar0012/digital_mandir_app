import { StyleSheet, Dimensions, Platform } from 'react-native';
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
        paddingTop: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
        width: '100%',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: spacing.xs,
        zIndex: 1,
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

    // Illustration Styles (Matching PhoneLoginScreen)
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
        fontSize: typography.fontSizes.lg, // Increased to lg
        fontWeight: typography.fontWeights.semibold as any,
        color: '#424242',
        marginBottom: 2,
    },
    bubbleSubtitle: {
        fontSize: typography.fontSizes.md, // Increased to md
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
    input: {
        backgroundColor: colors.neutral[50],
        borderWidth: 1,
        borderColor: colors.neutral[200],
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: typography.fontSizes.md,
        color: '#424242',
        marginBottom: spacing.md,
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
    phoneInput: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: typography.fontSizes.md,
        color: '#424242',
    },

    // Gender Selection
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xxl, // Increased margin for better spacing
        marginTop: spacing.md,
    },
    genderCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.neutral[50], // Light background
        borderWidth: 1,
        borderColor: colors.neutral[200],
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.sm,
        marginHorizontal: spacing.xs,
        // Shadow for card effect
        ...shadows.sm,
    },
    genderCardSelected: {
        backgroundColor: colors.secondary[50],
        borderColor: colors.secondary[500],
        // Stronger shadow for selected
        ...shadows.md,
    },
    genderIconContainer: {
        marginBottom: spacing.md,
        width: 60,
        height: 60,
        borderRadius: 30, // Circle
        backgroundColor: colors.neutral[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderIconContainerSelected: {
        backgroundColor: colors.secondary[100],
    },
    genderLabel: {
        fontSize: typography.fontSizes.md,
        fontWeight: typography.fontWeights.medium as any,
        color: colors.neutral[600],
    },
    genderLabelSelected: {
        color: colors.secondary[700],
        fontWeight: typography.fontWeights.bold as any,
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
        textAlignVertical: 'center',
        fontSize: typography.fontSizes.xl,
        fontWeight: typography.fontWeights.bold as any,
        color: '#424242',
        padding: 0,
        includeFontPadding: false,
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
    // Layout
    mainContainer: {
        flex: 1,
    },


    // DOB Step Header
    dobStepHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    dobStepIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.secondary[50],
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    dobSectionTitle: {
        fontSize: typography.fontSizes.xl,
        fontWeight: typography.fontWeights.bold as any,
        color: colors.neutral[800],
    },
    stepIndicator: {
        alignSelf: 'flex-end' as const,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: colors.secondary[50],
        marginBottom: spacing.md,
    },
    stepIndicatorText: {
        fontSize: typography.fontSizes.xs,
        fontWeight: typography.fontWeights.semibold as any,
        color: colors.secondary[700],
        letterSpacing: 0.5,
    },

    // Age/Date Input Styles
    dobInputContainer: {
        marginTop: spacing.md,
        marginBottom: spacing.xxl,
    },
    dobLabel: {
        fontSize: typography.fontSizes.md,
        color: '#424242',
        marginBottom: spacing.md,
        fontWeight: typography.fontWeights.medium as any,
    },
    dateInputsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    dateInput: {
        width: 60,
        height: 50,
        borderWidth: 1,
        borderColor: colors.neutral[300],
        borderRadius: borderRadius.sm,
        textAlign: 'center',
        fontSize: typography.fontSizes.lg,
        color: '#212121',
        backgroundColor: colors.neutral[0],
    },
    yearInput: {
        width: 100,
    },
    dateSeparator: {
        fontSize: typography.fontSizes.xl,
        color: '#BDBDBD',
        marginHorizontal: spacing.sm,
        fontWeight: '300',
    },

    // Age Input Box Display
    ageInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral[50],
        borderWidth: 1.5,
        borderColor: colors.secondary[300],
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    ageInputBoxFocused: {
        borderColor: colors.secondary[500],
        backgroundColor: colors.secondary[50],
    },
    ageInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    ageInputIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.secondary[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    ageInputTextContainer: {
        flex: 1,
    },
    ageInputLabel: {
        fontSize: typography.fontSizes.xs,
        fontWeight: typography.fontWeights.semibold as any,
        color: colors.secondary[600],
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    ageInputValue: {
        fontSize: typography.fontSizes.xxl,
        fontWeight: typography.fontWeights.bold as any,
        color: colors.neutral[800],
    },
    ageInputUnit: {
        fontSize: typography.fontSizes.md,
        fontWeight: typography.fontWeights.medium as any,
        color: colors.neutral[500],
        marginLeft: spacing.xs,
    },
    ageInputDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: spacing.xs,
    },
    ageInputDateText: {
        fontSize: typography.fontSizes.sm,
        color: colors.neutral[500],
        fontWeight: typography.fontWeights.medium as any,
    },

    // Compact Age Input Styles
    compactInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    compactInputBox: {
        backgroundColor: colors.neutral[0],
        borderWidth: 1,
        borderColor: colors.neutral[300],
        borderRadius: borderRadius.lg, // Rounded corners
        textAlign: 'center',
        fontSize: typography.fontSizes.xl,
        fontWeight: typography.fontWeights.bold as any,
        color: '#212121',
        paddingVertical: spacing.md,
        ...shadows.sm,
    },
    compactInputBoxDayMonth: {
        width: 70,
        height: 60,
    },
    compactInputBoxYear: {
        width: 100,
        height: 60,
    },
    compactInputLabel: {
        position: 'absolute',
        top: -25,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: typography.fontSizes.sm,
        color: colors.neutral[500],
        fontWeight: typography.fontWeights.medium as any,
    },


    // New Age Card Styles
    ageCard: {
        backgroundColor: '#FFF8E1', // Light yellow
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#FFC107', // Amber/Yellow border
        padding: spacing.lg,
        marginTop: spacing.xl,
        ...shadows.sm,
    },
    ageCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ageCardIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFE082', // Darker yellow for icon bg
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.lg,
    },
    ageCardTextContainer: {
        flex: 1,
    },
    ageCardLabel: {
        fontSize: typography.fontSizes.xs,
        fontWeight: typography.fontWeights.bold as any,
        color: '#FF8F00', // Dark Amber
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    ageCardValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    ageCardValue: {
        fontSize: typography.fontSizes.xxxl, // Very large
        fontWeight: typography.fontWeights.bold as any,
        color: '#212121', // Dark text
    },
    ageCardUnit: {
        fontSize: typography.fontSizes.lg,
        color: '#616161',
        marginLeft: spacing.xs,
        fontWeight: typography.fontWeights.medium as any,
    },
    ageCardDobText: {
        fontSize: typography.fontSizes.md,
        color: '#757575',
        marginTop: 2,
    },

    // Footer
    footer: {
        backgroundColor: colors.neutral[0],
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.neutral[100],
    },

    // Buttons
    submitButton: {
        backgroundColor: colors.secondary[400], // Keeping existing button style
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
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Done Screen Styles
    doneContainer: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    doneCheckmarkCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#4CAF50',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: spacing.xl,
        ...shadows.md,
    },
    doneTitle: {
        fontSize: typography.fontSizes.xxxl,
        fontWeight: typography.fontWeights.bold as any,
        color: colors.neutral[900],
        textAlign: 'center' as const,
        marginBottom: spacing.sm,
    },
    doneSubtitle: {
        fontSize: typography.fontSizes.lg,
        color: colors.neutral[500],
        textAlign: 'center' as const,
        marginBottom: spacing.xxl,
    },
    doneSummaryCard: {
        width: '100%' as any,
        backgroundColor: colors.neutral[50],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.neutral[200],
        padding: spacing.lg,
        ...shadows.sm,
    },
    doneSummaryRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    doneSummaryLabel: {
        fontSize: typography.fontSizes.md,
        color: colors.neutral[500],
        flex: 1,
    },
    doneSummaryValue: {
        fontSize: typography.fontSizes.md,
        fontWeight: typography.fontWeights.semibold as any,
        color: colors.neutral[800],
    },
    doneSummaryDivider: {
        height: 1,
        backgroundColor: colors.neutral[200],
        marginVertical: spacing.xs,
    },
});

