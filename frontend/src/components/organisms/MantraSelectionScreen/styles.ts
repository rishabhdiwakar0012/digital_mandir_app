import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isExtraSmallScreen = height < 680;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F0',
    },
    header: {
        backgroundColor: '#FFF8F0',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
        borderBottomWidth: 0,
    },
    headerTopContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center the logo stack
        width: '100%',
        marginBottom: 16,
        marginTop: 4,
        position: 'relative', // For absolute positioning of back button
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 10, // Match other screens
        padding: 4,
        zIndex: 1,
    },
    headerLogoContainer: {
        flexDirection: 'column', // Stack Image and Text like other screens
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 56,
        height: 56,
        marginBottom: 4,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#5D4037',
        alignSelf: 'center',
        fontFamily: 'serif',
        letterSpacing: 0.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12, // Ensure vertical padding is consistent
        shadowColor: '#5D4037',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1.5,
        borderColor: '#D7CCC8',
        width: '100%',
    },
    searchContainerFocused: {
        borderColor: '#E65100',
        backgroundColor: '#FFF8E1',
        shadowColor: '#E65100',
        shadowOpacity: 0.2,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#5D4037',
        paddingVertical: 0, // Reset vertical padding for standard centering
        textAlignVertical: 'center', // Address Android vertical text alignment
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        flexGrow: 1,
        paddingBottom: 120,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4E342E',
        fontFamily: 'Poppins_700Bold',
        marginBottom: 16,
        marginTop: 8,
    },
    mantraList: {
        gap: 12, // Use only gap for consistent spacing between items
    },
    card: {
        borderRadius: 20,
        marginBottom: 0, // Removed to avoid overlapping spacing with gap
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: 'rgba(212, 175, 55, 0.25)',
        overflow: 'hidden',
    },
    cardSelectedContainer: {
        borderColor: '#E65100',
        borderWidth: 2,
    },
    cardContent: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    cardGradient: {
        padding: 24,
        position: 'relative',
    },
    cardImageContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBackgroundImage: {
        width: '100%',
        height: '100%',
        opacity: 0.1,
    },
    cardBackgroundImageSelected: {
        opacity: 0.15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mantraTitleSanskrit: {
        fontSize: 20,
        fontWeight: '700',
        color: '#5D4037',
    },
    mantraTitleSanskritSelected: {
        color: '#FFFFFF',
    },
    mantraTitleHindi: {
        fontSize: 14,
        color: '#8D6E63',
        textTransform: 'capitalize',
        marginTop: 4,
    },
    mantraTitleHindiSelected: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    checkmarkContainer: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mantraTextPreview: {
        fontSize: 16,
        color: '#333333',
        lineHeight: 26,
        marginBottom: 8,
        marginTop: 8,
        fontStyle: 'italic',
        textAlign: 'left',
    },
    mantraTextPreviewSelected: {
        color: '#FFFFFF',
    },
    mantraMeaning: {
        fontSize: 13,
        color: '#757575',
        lineHeight: 20,
        textAlign: 'left',
    },
    mantraMeaningSelected: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    footer: {
        padding: isExtraSmallScreen ? spacing.xs : isSmallScreen ? spacing.sm : spacing.md,
        backgroundColor: 'transparent',
    },
    continueButtonContainer: {
        width: '100%',
        borderRadius: borderRadius.xl,
        shadowColor: '#E65100',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden',
    },
    continueButton: {
        paddingVertical: isExtraSmallScreen ? spacing.sm : isSmallScreen ? spacing.sm + 2 : 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonText: {
        color: colors.neutral[0],
        fontSize: isExtraSmallScreen ? typography.fontSizes.sm : typography.fontSizes.lg,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    emptyStateContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#8D6E63',
        textAlign: 'center',
    }
});
