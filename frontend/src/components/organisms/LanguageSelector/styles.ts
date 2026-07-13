import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isExtraSmallScreen = height < 680;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: isExtraSmallScreen ? 12 : isSmallScreen ? 16 : 24,
        paddingTop: isExtraSmallScreen ? 32 : isSmallScreen ? 40 : 48, // Status bar padding
    },
    // Header - matching PhoneLoginScreen
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: isExtraSmallScreen ? 16 : isSmallScreen ? 20 : 32,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    headerLogoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    headerText: {
        fontSize: isExtraSmallScreen ? 14 : 16,
        fontWeight: '700',
        color: '#0F1E3D',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
    },
    // Illustration Area - matching PhoneLoginScreen
    illustrationArea: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: isExtraSmallScreen ? 12 : isSmallScreen ? 16 : 24,
        marginTop: -8,
        paddingRight: 0,
    },
    image: {
        marginRight: 4,
        marginLeft: -12, // shift image left
    },
    placeholderImage: {
        width: 150,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
    },
    // Bubble - matching PhoneLoginScreen
    bubbleContainer: {
        flex: 1,
        marginLeft: 8,
        marginRight: 0,
    },

    bubbleTitle: {
        fontSize: isSmallScreen ? 15 : typography.fontSizes.lg, // Increased small screen font slightly
        fontWeight: typography.fontWeights.semibold as any,
        color: '#424242',
        marginBottom: 0,
    },
    bubbleSubtitle: {
        fontSize: isSmallScreen ? 13 : typography.fontSizes.md, // Increased small screen font slightly
        color: '#616161',
    },
    languageList: {
        width: '100%',
        gap: isExtraSmallScreen ? 8 : isSmallScreen ? 10 : 16,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: isExtraSmallScreen ? 8 : isSmallScreen ? 10 : 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
        width: '100%',
    },
    selectedOption: {
        borderColor: '#D44A27',
        backgroundColor: '#D44A27',
    },
    selectedOptionText: {
        color: '#FFFFFF',
    },
    iconContainer: {
        width: isExtraSmallScreen ? 28 : isSmallScreen ? 34 : 40,
        height: isExtraSmallScreen ? 28 : isSmallScreen ? 34 : 40,
        borderRadius: isExtraSmallScreen ? 14 : isSmallScreen ? 17 : 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: isExtraSmallScreen ? 10 : isSmallScreen ? 12 : 16,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    hindiIcon: {
        backgroundColor: '#F48E2F',
        borderColor: '#F48E2F',
    },
    englishIcon: {
        backgroundColor: '#F48E2F',
        borderColor: '#F48E2F',
    },
    iconText: {
        fontSize: isExtraSmallScreen ? 14 : isSmallScreen ? 16 : 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    languageName: {
        fontSize: isExtraSmallScreen ? 13 : isSmallScreen ? 15 : 18,
        fontWeight: '600',
        color: '#000000',
    },
    footer: {
        width: '100%',
        paddingVertical: isExtraSmallScreen ? 8 : isSmallScreen ? 12 : 24,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    continueButton: {
        backgroundColor: '#F48E2F',
        width: '100%',
        paddingVertical: isExtraSmallScreen ? 10 : isSmallScreen ? 12 : 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#F48E2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: isExtraSmallScreen ? 12 : isSmallScreen ? 14 : 16,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
