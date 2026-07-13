import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isExtraSmallScreen = height < 680;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral[0],
        padding: isExtraSmallScreen ? spacing.sm : isSmallScreen ? spacing.md : spacing.lg,
        paddingTop: isExtraSmallScreen ? spacing.lg : isSmallScreen ? spacing.xl : spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: isExtraSmallScreen ? spacing.sm : isSmallScreen ? spacing.md : spacing.xl,
        marginTop: isExtraSmallScreen ? spacing.xs : isSmallScreen ? spacing.sm : spacing.md,
    },
    backButton: {
        marginRight: spacing.md,
        padding: spacing.xs,
        zIndex: 1,
    },
    headerLogoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 40, // To offset the back button and center the logo visually
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: isSmallScreen ? 60 : 100, // Space for button
    },
    image: {
        width: isExtraSmallScreen ? width * 0.45 : isSmallScreen ? width * 0.55 : width * 0.7,
        height: isExtraSmallScreen ? width * 0.45 : isSmallScreen ? width * 0.55 : width * 0.7,
        marginBottom: isExtraSmallScreen ? spacing.sm : isSmallScreen ? spacing.md : spacing.xl,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: isExtraSmallScreen ? 18 : isSmallScreen ? 22 : 28,
        fontWeight: typography.fontWeights.bold as any,
        color: '#424242', // Dark grey for "Let's Start"
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: isExtraSmallScreen ? 18 : isSmallScreen ? 22 : 28,
        fontWeight: typography.fontWeights.bold as any,
        color: '#0F1E3D', // Dark blue for "Your Practice of"
        textAlign: 'center',
    },
    highlightText: {
        fontSize: isExtraSmallScreen ? 26 : isSmallScreen ? 32 : 48,
        fontWeight: typography.fontWeights.bold as any,
        color: '#0F1E3D', // Dark blue for "Jaap"
        marginTop: isExtraSmallScreen ? 0 : isSmallScreen ? spacing.xs : spacing.sm,
        textAlign: 'center',
    },
    footer: {
        padding: isExtraSmallScreen ? spacing.sm : isSmallScreen ? spacing.md : spacing.lg,
        paddingBottom: isExtraSmallScreen ? spacing.lg : isSmallScreen ? spacing.xl : spacing.xxl,
    },
    button: {
        backgroundColor: colors.secondary[400], // Orange
        paddingVertical: isExtraSmallScreen ? spacing.sm : isSmallScreen ? spacing.sm + 2 : spacing.md,
        borderRadius: borderRadius.xl,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
        borderBottomWidth: 4,
        borderBottomColor: '#E65100', // Darker orange for 3D effect
    },
    buttonText: {
        color: colors.neutral[0],
        fontSize: typography.fontSizes.md,
        fontWeight: typography.fontWeights.bold as any,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

