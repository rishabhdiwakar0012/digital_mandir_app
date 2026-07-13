import { StyleSheet, Platform, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isExtraSmallScreen = height < 680;
// Calculate card width for 2 columns with spacing
// padding horizontal: 20 -> 40 total
// gap between cards: 16
// available width: width - 40 - 16
// card width: (width - 56) / 2
const cardWidth = (width - 40 - 16) / 2;

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
        width: 56, // Match SelectionScreen
        height: 56,
        marginBottom: 4,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#5D4037',
        alignSelf: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        flexGrow: 1,
        paddingBottom: 32, // small breath — KAV + scrollToEnd handles keyboard clearance
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4E342E',
        fontFamily: 'Poppins_700Bold',
        marginBottom: 16,
        marginTop: 8,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16, // Use gap for exact 16px row/col separation
    },
    card: {
        width: cardWidth,
        aspectRatio: 1, // Square cards
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(212, 175, 55, 0.25)',
        overflow: 'hidden',
    },
    cardSelectedContainer: {
        borderColor: '#E65100',
        borderWidth: 2,
    },
    cardContent: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    cardGradient: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        // Removed inner borderRadius to rely entirely on card's overflow hidden for perfect clipping
    },
    countText: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#4E342E',
        lineHeight: 40,
    },
    countTextSelected: {
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    countLabel: {
        fontSize: 14,
        color: '#8D6E63',
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '500',
    },
    countLabelSelected: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    customCountContainer: {
        marginTop: 32,
        paddingHorizontal: 4,
    },
    customCountLabel: {
        fontSize: 16,
        color: '#5D4037',
        fontFamily: 'Poppins_600SemiBold',
        marginBottom: 12,
        fontWeight: '600',
    },
    customCountInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: 'rgba(212, 175, 55, 0.25)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 18,
        color: '#4E342E',
        fontWeight: 'bold',
        shadowColor: '#5D4037',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    customCountInputActive: {
        borderColor: '#E65100',
        backgroundColor: '#FFF8E1',
        shadowColor: '#E65100',
        shadowOpacity: 0.15,
        elevation: 4,
    },
    checkmarkContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
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
});
