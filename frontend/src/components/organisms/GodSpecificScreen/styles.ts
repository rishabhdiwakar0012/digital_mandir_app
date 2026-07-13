import { StyleSheet, Platform, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../../theme/tokens';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isExtraSmallScreen = height < 680;

const COLUMN_Gap = 16;
const PADDING_HORIZONTAL = 16;
const ITEM_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_Gap) / 2;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F0', // Light cream/beige
    },
    flexContainer: {
        flex: 1,
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
    backButton: {
        position: 'absolute',
        left: 0,
        top: 10, // Moved down slightly as requested
        padding: spacing.xs,
        zIndex: 1,
    },
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
    scrollContent: {
        paddingHorizontal: PADDING_HORIZONTAL,
        paddingTop: 8,
        flexGrow: 1,
        paddingBottom: 120,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: COLUMN_Gap,
    },
    card: {
        width: ITEM_WIDTH,
        aspectRatio: 1, // Square cards
        backgroundColor: '#FFFBEA', // Warmer Cream
        borderRadius: 20, // Rounded but standard "box" feel
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.2,
        borderColor: '#D4AF37', // Classic Gold Border
        // Subtle shadow "under box"
        shadowColor: '#8D6E63',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        padding: 0,
        marginBottom: 20, // Add explicit bottom margin to increase row spacing
        // overflow: 'hidden', // REMOVED to allow badge overflow
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
    imageContainer: {
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nameBadge: {
        position: 'absolute',
        bottom: -12, // Offset slightly less because badge is smaller
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8, // Less padding to give text more space
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#D4AF37', // Gold border matching card
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        alignSelf: 'center',
        width: '105%', // Let it overflow slightly horizontally if needed, or remove max width limitation
    },
    nameText: {
        fontSize: isExtraSmallScreen ? 12 : isSmallScreen ? 13 : 14, // Slightly tweaked to ensure fit
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
    },
    nameTextSelected: {
        color: '#E65100', // Matches the selected card state theme visually
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
        backgroundColor: 'transparent', // Match SelectionScreen
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
    continueButtonDisabledContainer: {
        backgroundColor: '#BDBDBD',
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonDisabled: {
        backgroundColor: 'transparent',
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
