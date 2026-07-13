import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral[0],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    logo: {
        width: 30,
        height: 30,
        marginRight: spacing.sm,
    },
    headerText: {
        fontSize: typography.fontSizes.lg,
        fontFamily: 'Poppins_700Bold',
        color: '#0F1E3D',
    },
    // ScrollView content — centers image + text vertically
    contentContainer: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    imageContainer: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontFamily: 'Poppins_700Bold',
        color: '#424242',
        textAlign: 'center',
        marginBottom: 2,
    },
    subtitle: {
        fontFamily: 'Poppins_700Bold',
        color: '#424242',
        textAlign: 'center',
    },
    // Footer is pinned at bottom, never overlaps content
    footer: {
        width: '100%',
        paddingHorizontal: spacing.lg,
        gap: 10,
    },
    primaryButton: {
        backgroundColor: colors.secondary[400],
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
        borderBottomWidth: 4,
        borderBottomColor: '#E65100',
    },
    primaryButtonText: {
        color: colors.neutral[0],
        fontFamily: 'Poppins_700Bold',
    },
    secondaryButton: {
        backgroundColor: colors.neutral[0],
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.neutral[200],
        ...shadows.sm,
    },
    secondaryButtonText: {
        color: colors.secondary[500],
        fontFamily: 'Poppins_700Bold',
    },
});
