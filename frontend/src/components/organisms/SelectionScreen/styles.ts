import { StyleSheet, Platform, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isExtraSmallScreen = height < 680;
// Calculate card width for 2 columns with spacing
// padding horizontal: 20 -> 40 total
// gap between cards: 16
// available width: width - 40 - 16
// card width: (width - 56) / 2
const cardWidth = (width - (spacing.md * 2) - spacing.md) / 2;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F0', // Light cream/beige
    },
    flexContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: 8,
        flexGrow: 1,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'column', // Stack top bar and search bar
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: '#FFF8F0',
        zIndex: 10,
    },
    headerTopContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center the logo stack
        width: '100%',
        marginBottom: spacing.md,
        marginTop: spacing.xs,
        position: 'relative', // For absolute positioning of back button
    },
    // backButtonPlaceholder removed
    headerLogoContainer: {
        flexDirection: 'column', // Stack Image and Text
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 56,
        height: 56,
        marginBottom: spacing.xs,
    },
    headerText: {
        fontSize: isExtraSmallScreen ? typography.fontSizes.lg : typography.fontSizes.xl,
        fontWeight: 'bold',
        color: '#5D4037',
        alignSelf: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // More traditional font
        letterSpacing: 0.5,
    },
    contentContainer: {
        padding: spacing.md,
        flexGrow: 1,
        paddingTop: spacing.xs, // Reduced since search is now in header
        paddingBottom: 120,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: isExtraSmallScreen ? spacing.xs : 12,
        shadowColor: '#5D4037',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1.5, // Slightly thicker for border transition
        borderColor: '#D7CCC8',
        width: '100%',
    },
    searchContainerFocused: {
        borderColor: '#E65100', // Highlight color (Orange)
        backgroundColor: '#FFF8E1', // Very subtle orange tint
        shadowColor: '#E65100',
        shadowOpacity: 0.2,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: isExtraSmallScreen ? typography.fontSizes.sm : 16,
        color: '#5D4037',
        paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        // Gap handles both row and column spacing if supported, fallback to margin if not.
        // Assuming RN 0.71+, gap works.
        gap: spacing.md,
    },
    card: {
        width: cardWidth,
        aspectRatio: 1, // Square cards
        backgroundColor: '#FFFBEA', // Warmer Cream
        borderRadius: 20, // Rounded but standard "box" feel
        alignItems: 'center',
        justifyContent: 'center',
        // marginBottom removed to let gap handle it, OR match horizontal gap
        // marginBottom: spacing.md, <--- REMOVED
        borderWidth: 1.2,
        borderColor: '#D4AF37', // Classic Gold Border
        // Subtle shadow "under box"
        shadowColor: '#8D6E63',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        padding: 0,
        overflow: 'hidden',
    },
    cardSelectedContainer: {
        borderColor: 'transparent',
        shadowColor: '#E65100', // Orange-ish shadow for selected
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cardContent: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isExtraSmallScreen ? spacing.xs : isSmallScreen ? spacing.xs : spacing.sm,
    },
    cardGradient: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isExtraSmallScreen ? spacing.xs : isSmallScreen ? spacing.xs : spacing.sm,
        borderRadius: 20, // Match card borderRadius to clip gradient
    },
    icon: {
        marginBottom: isExtraSmallScreen ? spacing.xs : isSmallScreen ? spacing.sm : spacing.md,
    },
    cardText: {
        fontSize: isExtraSmallScreen ? 14 : isSmallScreen ? 16 : 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#4E342E',
        lineHeight: isExtraSmallScreen ? 16 : isSmallScreen ? 18 : 19,
    },
    cardTextSelected: {
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    checkmarkContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#FFFFFF', // White circle
        borderRadius: 12, // Slightly larger
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    footer: {
        padding: isExtraSmallScreen ? spacing.xs : isSmallScreen ? spacing.sm : spacing.md,
        // paddingBottom handled in component via insets
        backgroundColor: 'transparent',
    },
    continueButtonContainer: {
        width: '100%',
        borderRadius: 10,
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
    continueButtonDisabled: {
        backgroundColor: '#BDBDBD',
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
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

